<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('shipping_address_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('courier_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('pickup_method', ['ambil', 'kirim']);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->string('tracking_number')->nullable();
            $table->string('delivery_image')->nullable(); // bukti foto
            $table->date('estimated_arrival')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_deliveries');
    }
};

