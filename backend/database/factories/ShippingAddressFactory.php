<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class ShippingAddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'province_id' => 1, // pastikan ID 1 ada di tabel provinces
            'city_id' => 1,     // pastikan ID 1 ada di tabel cities
            'recipient_name' => $this->faker->name(),
            'phone_number' => $this->faker->phoneNumber(),
            'full_address' => $this->faker->address(),
            'postal_code' => $this->faker->postcode(),
            'notes' => $this->faker->sentence(),
            'is_primary' => 1,
            'is_active' => 1,
        ];
    }
}
