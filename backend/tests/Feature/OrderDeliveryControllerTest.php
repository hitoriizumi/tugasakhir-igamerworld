<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderDelivery;
use App\Models\ShippingAddress;
use App\Models\Product;
use App\Models\OrderItem;
use App\Models\Courier;
use App\Models\PaymentMethod;

class OrderDeliveryControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_update_order_delivery()
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role_id' => 2]);
        $customer = User::factory()->create();
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);
        $product = Product::factory()->create();

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'diproses',
            'payment_status' => 'sudah_bayar',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => $product->price,
            'subtotal' => $product->price,
        ]);

        $delivery = OrderDelivery::factory()->create([
            'order_id' => $order->id,
            'pickup_method' => 'kirim',
        ]);

        $token = $admin->createToken('auth_token')->plainTextToken;

        $image = UploadedFile::fake()->create('delivery.jpg', 100); // tanpa dependensi GD


        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/orders/product/{$order->id}/delivery", [
                'tracking_number' => 'TRK123456',
                'estimated_arrival' => now()->addDays(3)->format('Y-m-d'),
                'notes' => 'Pesanan dikirim oleh JNE',
                'delivery_image' => $image,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);
    }

    public function test_admin_can_mark_order_as_finished()
    {
        $admin = User::factory()->create(['role_id' => 2]);
        $customer = User::factory()->create();
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'dikirim',
            'payment_status' => 'sudah_bayar',
        ]);

        $delivery = OrderDelivery::factory()->create([
            'order_id' => $order->id,
            'pickup_method' => 'ambil',
            'delivery_image' => 'https://example.com/image.jpg',
            'estimated_arrival' => now()->addDays(2)->format('Y-m-d'),
        ]);

        $token = $admin->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/orders/product/{$order->id}/delivery/finish");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Pesanan berhasil ditandai selesai oleh admin.']);
    }

    public function test_customer_can_confirm_received_order()
    {
        $customer = User::factory()->create();
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'dikirim',
            'payment_status' => 'sudah_bayar',
        ]);

        $delivery = OrderDelivery::factory()->create([
            'order_id' => $order->id,
            'pickup_method' => 'kirim',
        ]);

        $token = $customer->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/customer/orders/product/{$order->id}/delivery/confirm");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Terima kasih! Pesanan berhasil dikonfirmasi diterima.']);
    }
}
