<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\User;
use App\Models\Order;
use App\Models\PaymentConfirmation;
use App\Models\ShippingAddress;
use App\Models\Courier;
use App\Models\PaymentMethod;

class PaymentConfirmationControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_submit_payment_confirmation()
    {
        Storage::fake('public');

        $customer = User::factory()->create(['role_id' => 3]);
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_pembayaran',
            'payment_status' => 'belum_bayar',
        ]);

        $image = UploadedFile::fake()->create('payment.jpg', 100);
        $token = $customer->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/orders/customer/product/{$order->id}/payment-confirmation", [
                'payment_image' => $image,
                'bank_name' => 'BCA',
                'account_number' => '1234567890',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'data']);
    }

    public function test_customer_can_update_payment_confirmation()
    {
        Storage::fake('public');

        $customer = User::factory()->create(['role_id' => 3]);
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_pembayaran',
            'payment_status' => 'sudah_bayar',
        ]);

        $confirmation = PaymentConfirmation::create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'payment_image' => 'https://example.com/oldproof.jpg',
            'bank_name' => 'BRI',
            'account_number' => '111222333',
            'transfer_time' => now(),
            'is_verified' => null,
        ]);

        $newImage = UploadedFile::fake()->create('updated_payment.jpg', 100);
        $token = $customer->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/orders/{$order->id}/confirm-payment", [
                'payment_image' => $newImage,
                'bank_name' => 'BNI',
                'account_number' => '999888777',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);
    }

    public function test_admin_can_verify_payment_confirmation()
    {
        $admin = User::factory()->create(['role_id' => 2]);
        $customer = User::factory()->create(['role_id' => 3]);
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $shippingAddress = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address_id' => $shippingAddress->id,
            'order_type' => 'product',
            'order_status' => 'menunggu_pembayaran',
            'payment_status' => 'belum_bayar',
        ]);

        PaymentConfirmation::create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'payment_image' => 'https://example.com/proof.jpg',
            'bank_name' => 'Mandiri',
            'account_number' => '5678901234',
            'transfer_time' => now(),
            'is_verified' => null,
        ]);

        $token = $admin->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/orders/{$order->id}/payment-confirmation/verify", [
                'is_verified' => true,
                'note' => 'Pembayaran valid.',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Status pembayaran berhasil diperbarui.']);
    }
}
