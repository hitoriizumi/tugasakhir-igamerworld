<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\ShippingAddress;
use App\Models\Courier;
use App\Models\PaymentMethod;
use App\Models\ProductCompatibility;

class CustomPCOrderControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_checkout_custom_pc_order()
    {
        $customer = User::factory()->create(['role_id' => 3]);
        $courier = Courier::factory()->create();
        $paymentMethod = PaymentMethod::factory()->create();
        $address = ShippingAddress::factory()->create(['user_id' => $customer->id]);

        $category = Category::factory()->create(['name' => 'Komponen']);

        $subcategories = [
            'Motherboard',
            'Processor',
            'RAM',
            'Storage (SSD / HDD)',
            'PSU',
            'Casing',
            'GPU',
        ];

        $products = [];

        foreach ($subcategories as $name) {
            $subcategory = Subcategory::factory()->create([
                'name' => $name,
                'category_id' => $category->id,
            ]);

            $product = Product::factory()->create([
                'subcategory_id' => $subcategory->id,
                'status_stock' => 'ready_stock',
                'stock' => 10,
                'price' => 1000000,
                'has_igpu' => $name === 'Processor' ? false : null,
            ]);

            $products[] = $product;
        }

        // Buat semua produk kompatibel satu sama lain
        foreach ($products as $i => $productA) {
            for ($j = $i + 1; $j < count($products); $j++) {
                $productB = $products[$j];

                ProductCompatibility::create([
                    'product_id' => $productA->id,
                    'compatible_with_id' => $productB->id,
                ]);

                ProductCompatibility::create([
                    'product_id' => $productB->id,
                    'compatible_with_id' => $productA->id,
                ]);
            }
        }

        $components = collect($products)->map(fn($p) => [
            'product_id' => $p->id,
            'quantity' => 1,
        ])->toArray();

        $token = $customer->createToken('auth_token')->plainTextToken;

        $payload = [
            'shipping_address_id' => $address->id,
            'courier_id' => $courier->id,
            'payment_method_id' => $paymentMethod->id,
            'components' => $components,
            'build_by_store' => true,
            'pickup_method' => 'kirim',
            'note' => 'Tolong rakit dengan rapi.',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/custom-pc-orders', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'order_id', 'invoice_number']);
    }
}
