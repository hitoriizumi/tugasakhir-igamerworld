<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CourierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'code' => strtoupper($this->faker->unique()->bothify('CR###')),
            'description' => $this->faker->sentence(),
            'image' => $this->faker->imageUrl(300, 200, 'transport', true, 'courier'),
            'is_active' => 1,
        ];
    }
}
