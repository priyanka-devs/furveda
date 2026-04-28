from django.contrib import admin
from .models import Product, ProductImage, ProductBotanical, ContactMessage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


class ProductBotanicalInline(admin.TabularInline):
    model = ProductBotanical
    extra = 3


class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline, ProductBotanicalInline]
    filter_horizontal = ('related_products',)


admin.site.register(Product, ProductAdmin)
admin.site.register(ContactMessage)

from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'payment_method', 'payment_status', 'total_amount', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'razorpay_order_id')
    inlines = [OrderItemInline]

admin.site.register(Order, OrderAdmin)