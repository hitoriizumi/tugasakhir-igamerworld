<?php

// database/factories/PaymentMethodFactory.php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentMethodFactory extends Factory
{
    public function definition(): array
    {
        return [
            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BRI', 'BNI']),
            'account_number' => $this->faker->numerify('############'),
            'account_holder' => $this->faker->name(),
            'image' => 'https://via.placeholder.com/150',
            'is_active' => 1,
        ];
    }
}
