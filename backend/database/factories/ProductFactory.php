<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Brand;
use App\Models\Subcategory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'subcategory_id' => Subcategory::factory(),
            'brand_id' => Brand::factory(),
            'has_igpu' => false,
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'price' => $this->faker->numberBetween(10000, 100000),
            'stock' => $this->faker->numberBetween(5, 20),
            'status_stock' => 'ready_stock',
            'main_image' => 'product.jpg',
            'is_active' => 1,
        ];
    }
}
