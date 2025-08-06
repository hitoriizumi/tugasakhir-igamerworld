<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => 1, // bisa di-override saat create
            'product_id' => 1, // bisa di-override juga
            'quantity' => $this->faker->numberBetween(1, 3),
        ];
    }
}
