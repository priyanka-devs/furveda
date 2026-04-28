from django.db import models

from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username}"
class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.FloatField()
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    cat = models.CharField(max_length=50, default='all')
    catLabel = models.CharField(max_length=100, default='Products')
    badge = models.CharField(max_length=50, blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    
    # Extra images for gallery
    image_url_2 = models.URLField(max_length=500, blank=True, null=True)
    image_url_3 = models.URLField(max_length=500, blank=True, null=True)
    image_url_4 = models.URLField(max_length=500, blank=True, null=True)
    image_url_5 = models.URLField(max_length=500, blank=True, null=True)
    
    # Dynamic content
    benefits = models.TextField(blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    usage = models.TextField(blank=True, null=True)
    
    # Related products manually picked in admin
    related_products = models.ManyToManyField('self', blank=True, symmetrical=False)

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='products/gallery/')

    def __str__(self):
        return self.product.name

class ProductBotanical(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='botanicals')
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='botanicals/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.name} for {self.product.name}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} - {self.subject}"

class Order(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    total_amount = models.FloatField()
    
    PAYMENT_METHOD_CHOICES = (
        ('COD', 'Cash on Delivery'),
        ('ONLINE', 'Online Payment'),
    )
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    
    PAYMENT_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Failed', 'Failed'),
    )
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.first_name} {self.last_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=200)
    price = models.FloatField()
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"
