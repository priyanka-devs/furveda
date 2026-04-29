from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import Product, ContactMessage, Order, OrderItem
import json
import razorpay
import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from .models import UserProfile, PasswordResetOTP

def landing(request):
    featured_products = Product.objects.filter(is_featured=True)[:3]
    return render(request, 'index.html', {'featured_products': featured_products})

def shop(request):
    q = request.GET.get('q', '')
    if q:
        from django.db.models import Q
        objects = Product.objects.filter(Q(name__icontains=q) | Q(description__icontains=q) | Q(cat__icontains=q)).prefetch_related('gallery')
    else:
        objects = Product.objects.prefetch_related('gallery').all()
        
    products_list = []
    
    for p in objects:
        imgs = []
        if p.image_url: imgs.append(p.image_url)
        elif p.image: imgs.append(p.image.url)
        
        if p.image_url_2: imgs.append(p.image_url_2)
        if p.image_url_3: imgs.append(p.image_url_3)
        if p.image_url_4: imgs.append(p.image_url_4)
        if p.image_url_5: imgs.append(p.image_url_5)
        
        for gallery_img in p.gallery.all():
            if gallery_img.image:
                imgs.append(gallery_img.image.url)
                
        # Ensure we always have an img field even if empty
        main_img = imgs[0] if imgs else ''
        
        products_list.append({
            'id': p.id, 'name': p.name, 'price': p.price,
            'cat': p.cat, 'catLabel': p.catLabel,
            'badge': p.badge, 'featured': p.is_featured,
            'img': main_img,
            'images': imgs
        })
    
    return render(request, 'shop.html', {'products_json': json.dumps(products_list)})

def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    # We serialize this single product so the add to cart functionality 
    # can work directly via the JS framework if needed.
    product_json = {
        'id': product.id, 'name': product.name, 'price': product.price,
        'cat': product.cat, 'catLabel': product.catLabel,
        'badge': product.badge, 'featured': product.is_featured,
        'img': product.image_url if product.image_url else (product.image.url if product.image else '')
    }
    
    related_products = product.related_products.all()
    if not related_products.exists():
        related_products = Product.objects.exclude(id=product.id)[:4]

    context = {
        'product': product,
        'product_json': json.dumps(product_json),
        'related_products': related_products
    }
    return render(request, 'product_detail.html', context)

def about(request):
    return render(request, 'about.html')

def cart_page(request):
    return render(request, 'cart.html')

def login_page(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # We use email as the username for Django's built-in User model
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'login.html')

def logout_user(request):
    logout(request)
    return redirect('home')

def register_page(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')

        if User.objects.filter(username=email).exists():
            messages.error(request, 'Email is already registered. Please log in.')
        else:
            user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
            user.save()
            from .models import UserProfile
            UserProfile.objects.create(user=user, phone_number=phone)
            login(request, user)
            messages.success(request, 'Account created successfully! Welcome to Furveda.')
            return redirect('home')
            
    return render(request, 'register.html')

def checkout(request):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to place an order.')
        return redirect('login')
        
    return render(request, 'checkout.html', {
        'razorpay_key_id': settings.RAZORPAY_KEY_ID
    })

@csrf_exempt
def create_order(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'You must be logged in to place an order.'}, status=401)
        
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email = data.get('email')
            address = data.get('address')
            city = data.get('city')
            postal_code = data.get('postal_code')
            payment_method = data.get('payment_method')
            cart = data.get('cart', [])
            
            if not cart:
                return JsonResponse({'status': 'error', 'message': 'Cart is empty'}, status=400)
                
            # Calculate total
            total_amount = sum(item['price'] * item['qty'] for item in cart)
            # Add shipping
            total_amount += 10.00
            
            # Create Order
            order = Order.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                address=address,
                city=city,
                postal_code=postal_code,
                payment_method=payment_method,
                total_amount=total_amount,
                payment_status='Pending'
            )
            
            # Create Order Items
            for item in cart:
                OrderItem.objects.create(
                    order=order,
                    product_name=item['name'],
                    price=item['price'],
                    quantity=item['qty']
                )
                
            if payment_method == 'COD':
                return JsonResponse({
                    'status': 'success', 
                    'method': 'COD', 
                    'order_id': order.id,
                    'redirect_url': '/order-success/?order_id=' + str(order.id)
                })
            elif payment_method == 'ONLINE':
                # Create Razorpay Order
                currency = "INR"
                amount_in_paise = int(total_amount * 100)
                
                print("DEBUG KEYS:", settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                razorpay_order = razorpay_client.order.create(dict(amount=amount_in_paise, currency=currency, payment_capture='0'))
                
                order.razorpay_order_id = razorpay_order['id']
                order.save()
                
                return JsonResponse({
                    'status': 'success',
                    'method': 'ONLINE',
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': amount_in_paise,
                    'currency': currency,
                    'order_id': order.id,
                    'name': first_name + ' ' + last_name,
                    'email': email
                })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e) + f" (KEYS: {settings.RAZORPAY_KEY_ID}, {settings.RAZORPAY_KEY_SECRET})" }, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

@csrf_exempt
def verify_payment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            razorpay_payment_id = data.get('razorpay_payment_id')
            razorpay_order_id = data.get('razorpay_order_id')
            razorpay_signature = data.get('razorpay_signature')
            order_id = data.get('order_id')
            
            order = Order.objects.get(id=order_id)
            
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Log params to debug
            with open("razorpay_debug.txt", "w") as f:
                f.write(f"KEY_SECRET: {settings.RAZORPAY_KEY_SECRET}\n")
                f.write(f"Params: {json.dumps(params_dict)}\n")

            # Verify signature
            try:
                razorpay_client.utility.verify_payment_signature(params_dict)
                # Signature is verified, payment is captured automatically due to payment_capture='1'
                
                order.payment_status = 'Paid'
                order.razorpay_payment_id = razorpay_payment_id
                order.razorpay_signature = razorpay_signature
                order.save()
                return JsonResponse({'status': 'success', 'redirect_url': '/order-success/?order_id=' + str(order.id)})
            except razorpay.errors.SignatureVerificationError:
                with open("razorpay_debug.txt", "a") as f:
                    f.write("ERROR: SignatureVerificationError\n")
                order.payment_status = 'Failed'
                order.save()
                return JsonResponse({'status': 'error', 'redirect_url': '/payment-failed/'})
                
        except Exception as e:
            # Log the error to a file for debugging
            import traceback
            with open("razorpay_error.log", "w") as f:
                f.write(traceback.format_exc())
                
            # If verification throws an exception, it failed
            try:
                order = Order.objects.get(id=order_id)
                order.payment_status = 'Failed'
                order.save()
            except:
                pass
            return JsonResponse({'status': 'error', 'redirect_url': '/payment-failed/'})
            
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

def order_success_page(request):
    order_id = request.GET.get('order_id')
    try:
        order = Order.objects.get(id=order_id)
        return render(request, 'order_success.html', {'order': order})
    except Order.DoesNotExist:
        return redirect('home')

def payment_failed_page(request):
    return render(request, 'payment_failed.html')

def order_success(request):
    return render(request, 'order_success.html')

def contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        if name and email and message:
            ContactMessage.objects.create(
                name=name, email=email, subject=subject, message=message
            )
            messages.success(request, 'Your message has been sent successfully!')
            return redirect('contact')
        else:
            messages.error(request, 'Please fill in all required fields.')
            
    return render(request, 'contact.html')

@login_required
def my_orders(request):
    orders = Order.objects.filter(email=request.user.email).order_by('-created_at')
    return render(request, 'my_orders.html', {'orders': orders})

@login_required
def track_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, email=request.user.email)
    
    statuses = ['Order Confirmation', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
    
    current_status_index = -1
    if order.status in statuses:
        current_status_index = statuses.index(order.status)
        
    return render(request, 'track_order.html', {
        'order': order,
        'statuses': statuses,
        'current_status_index': current_status_index,
    })

@login_required
def profile(request):
    try:
        user_profile = request.user.profile
    except UserProfile.DoesNotExist:
        user_profile = UserProfile.objects.create(user=request.user)
        
    if request.method == 'POST':
        user_profile.phone_number = request.POST.get('phone_number', user_profile.phone_number)
        user_profile.address_street = request.POST.get('address_street', user_profile.address_street)
        user_profile.address_apt = request.POST.get('address_apt', user_profile.address_apt)
        user_profile.address_city = request.POST.get('address_city', user_profile.address_city)
        user_profile.address_state = request.POST.get('address_state', user_profile.address_state)
        user_profile.address_postal = request.POST.get('address_postal', user_profile.address_postal)
        user_profile.address_country = request.POST.get('address_country', user_profile.address_country)
        user_profile.save()
        messages.success(request, 'Profile updated successfully.')
        return redirect('profile')
        
    orders = Order.objects.filter(email=request.user.email).order_by('-created_at')
    
    # We will pass the statuses so the template can render the tracker
    statuses = ['Order Confirmation', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
    
    return render(request, 'profile.html', {
        'user_profile': user_profile,
        'orders': orders,
        'statuses': statuses
    })
