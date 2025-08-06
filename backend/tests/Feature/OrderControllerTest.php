<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderDelivery;
use App\Models\ShippingAddress;
use App\Models\Courier;
use App\Models\PaymentMethod;

class OrderControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_checkout_product_order()
    {
        $customer = User::factory()->create();

        $subcategory = \App\Models\Subcategory::factory()->create();
        $brand = \App\Models\Brand::factory()->create();
        $product = Product::factory()->create([
            'subcategory_id' => $subcategory->id,
            'brand_id' => $brand->id,
            'stock' => 10,
            'status_stock' => 'ready_stock',
        ]);

        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();

        $cart = Cart::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $token = $customer->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
              ->postJson('/api/checkout', [
                'shipping_address_id' => $shippingAddress->id,
                'courier_id' => $courier->id,
                'payment_method_id' => $paymentMethod->id,
                'note' => 'Tolong cepat ya',
                'cart_ids' => [$cart->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'data']);
    }

    public function test_admin_can_update_order_status()
    {
        $admin = User::factory()->create(['role_id' => 2]);
        $customer = User::factory()->create();

        $product = Product::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_verifikasi',
            'payment_status' => 'belum_bayar',
        ]);

        OrderDelivery::factory()->create([
            'order_id' => $order->id,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => $product->price,
            'subtotal' => $product->price,
        ]);

        $token = $admin->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/orders/admin/product/{$order->id}/update-status", [
                'status' => 'menunggu_pembayaran',
                'shipping_cost' => 20000,
                'note' => 'Pesanan diproses',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Status pesanan berhasil diperbarui.']);
    }

    public function test_customer_can_cancel_order()
    {
        $customer = User::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_verifikasi',
            'payment_status' => 'belum_bayar',
            'invoice_number' => 'INV/TEST/001',
        ]);

        $token = $customer->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/orders/{$order->id}/cancel", [
                'note' => 'Saya ingin membatalkan pesanan',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Pesanan berhasil dibatalkan.']);
    }

    public function test_admin_can_approve_all_pending_product_orders()
    {
        $admin = User::factory()->create(['role_id' => 2]);
        $customer = User::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        Order::factory()->create([
            'user_id' => $customer->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_verifikasi',
            'payment_status' => 'belum_bayar',
            'invoice_number' => 'INV/TEST/002',
        ]);

        $token = $admin->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/orders/admin/product/approve-all');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Semua pesanan produk berhasil disetujui.']);
    }
}
