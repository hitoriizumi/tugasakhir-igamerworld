<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subcategory_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');

            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0); // support harga besar
            $table->integer('stock')->default(0);
            $table->enum('status_stock', ['ready_stock', 'pre_order', 'out_of_stock'])->default('ready_stock');
            $table->string('main_image')->nullable(); // URL gambar utama

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes(); // untuk penghapusan lunak
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
