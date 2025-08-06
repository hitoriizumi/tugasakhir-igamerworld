<?php

// database/factories/OrderDeliveryFactory.php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Order;

class OrderDeliveryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(), // atau sesuaikan jika test case sudah buat order dulu
            'pickup_method' => $this->faker->randomElement(['ambil', 'kirim']),
            'shipping_cost' => $this->faker->randomFloat(2, 10000, 50000),
            'tracking_number' => $this->faker->uuid(), // bisa diganti string acak pendek kalau perlu
            'delivery_image' => 'https://via.placeholder.com/150', // dummy URL
            'estimated_arrival' => $this->faker->dateTimeBetween('+1 day', '+7 days')->format('Y-m-d'),
            'notes' => $this->faker->sentence(),
        ];
    }
}

