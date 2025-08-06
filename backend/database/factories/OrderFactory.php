<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\ShippingAddress;
use App\Models\Courier;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'shipping_address_id' => ShippingAddress::factory(),
            'courier_id' => Courier::factory(),
            'payment_method_id' => PaymentMethod::factory(),
            'order_type' => 'product',
            'invoice_number' => 'INV/' . now()->format('Ymd') . '/' . strtoupper(Str::random(6)),
            'total_price' => $this->faker->numberBetween(50000, 500000),
            'order_status' => 'menunggu_verifikasi',
            'payment_status' => 'belum_bayar',
        ];
    }
}
