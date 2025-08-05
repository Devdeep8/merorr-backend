const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create Colors
    console.log('Creating colors...');
    const colors = await prisma.color.createMany({
      data: [
        { name: 'Black', hexCode: '#000000' },
        { name: 'White', hexCode: '#FFFFFF' },
        { name: 'Navy Blue', hexCode: '#000080' },
        { name: 'Gray', hexCode: '#808080' },
        { name: 'Red', hexCode: '#FF0000' },
        { name: 'Blue', hexCode: '#0000FF' },
        { name: 'Green', hexCode: '#008000' },
        { name: 'Brown', hexCode: '#A52A2A' },
        { name: 'Beige', hexCode: '#F5F5DC' },
        { name: 'Pink', hexCode: '#FFC0CB' },
        { name: 'Purple', hexCode: '#800080' },
        { name: 'Yellow', hexCode: '#FFFF00' },
        { name: 'Orange', hexCode: '#FFA500' },
        { name: 'Khaki', hexCode: '#F0E68C' },
        { name: 'Maroon', hexCode: '#800000' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${colors.count} colors`);

    // Create Styles
    console.log('Creating styles...');
    const styles = await prisma.style.createMany({
      data: [
        { name: 'Skinny Fit Jeans', fitType: 'SKINNY' },
        { name: 'Skinny Fit Chinos', fitType: 'SKINNY' },
        { name: 'Relaxed Fit T-Shirt', fitType: 'RELAXED' },
        { name: 'Relaxed Fit Hoodie', fitType: 'RELAXED' },
        { name: 'Oversized Sweater', fitType: 'OVERSIZED' },
        { name: 'Oversized Jacket', fitType: 'OVERSIZED' },
        { name: 'Classic Fit Shirt', fitType: 'CLASSIC' },
        { name: 'Classic Fit Blazer', fitType: 'CLASSIC' },
        { name: 'Skinny Fit Dress Pants', fitType: 'SKINNY' },
        { name: 'Relaxed Fit Cargo Pants', fitType: 'RELAXED' },
        { name: 'Oversized Denim Jacket', fitType: 'OVERSIZED' },
        { name: 'Classic Fit Polo', fitType: 'CLASSIC' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${styles.count} styles`);

    // Create Brands
    console.log('Creating brands...');
    const brandData = [
      { name: 'Nike' },
      { name: 'Adidas' },
      { name: 'Zara' },
      { name: 'H&M' },
      { name: 'Uniqlo' },
      { name: 'Levi\'s' },
      { name: 'Calvin Klein' },
      { name: 'Tommy Hilfiger' }
    ];

    const createdBrands = [];
    for (const brand of brandData) {
      const createdBrand = await prisma.brand.upsert({
        where: { name: brand.name },
        update: {},
        create: brand
      });
      createdBrands.push(createdBrand);
    }
    console.log(`✅ Created ${createdBrands.length} brands`);

    // Create Product Types
    console.log('Creating product types...');
    const productTypeData = [
      { name: 'T-Shirts' },
      { name: 'Jeans' },
      { name: 'Hoodies' },
      { name: 'Jackets' },
      { name: 'Shirts' },
      { name: 'Pants' },
      { name: 'Sweaters' },
      { name: 'Dresses' }
    ];

    const createdProductTypes = [];
    for (const productType of productTypeData) {
      const createdProductType = await prisma.productType.upsert({
        where: { name: productType.name },
        update: {},
        create: productType
      });
      createdProductTypes.push(createdProductType);
    }
    console.log(`✅ Created ${createdProductTypes.length} product types`);

    // Create Collections
    console.log('Creating collections...');
    const collectionData = [
      { name: 'Summer Collection', description: 'Light and comfortable summer wear' },
      { name: 'Winter Collection', description: 'Warm and cozy winter clothing' },
      { name: 'Casual Wear', description: 'Everyday casual clothing' },
      { name: 'Formal Wear', description: 'Professional and formal attire' },
      { name: 'Sportswear', description: 'Athletic and sports clothing' }
    ];

    const createdCollections = [];
    for (const collection of collectionData) {
      const createdCollection = await prisma.collection.upsert({
        where: { name: collection.name },
        update: {},
        create: collection
      });
      createdCollections.push(createdCollection);
    }
    console.log(`✅ Created ${createdCollections.length} collections`);

    // Get created data for relationships
    const allColors = await prisma.color.findMany();
    const allStyles = await prisma.style.findMany();

    // Create Sample Products
    console.log('Creating sample products...');
    const sampleProducts = [
      {
        name: 'Classic White T-Shirt',
        slug: 'classic-white-t-shirt',
        sku: 'CWT-001',
        description: 'A comfortable classic white t-shirt made from 100% cotton',
        price: 29.99,
        discountedPrice: 24.99,
        currency: 'USD',
        quantityInStock: 100,
        inStock: true,
        weight: 0.2,
        brandId: createdBrands.find(b => b.name === 'Uniqlo')?.id,
        productTypeId: createdProductTypes.find(pt => pt.name === 'T-Shirts')?.id,
        seoTitle: 'Classic White T-Shirt - Comfortable Cotton Tee',
        seoDescription: 'Shop our classic white t-shirt made from premium cotton. Perfect for everyday wear.',
        mainMedia: 'https://example.com/images/white-tshirt.jpg'
      },
      {
        name: 'Skinny Fit Blue Jeans',
        slug: 'skinny-fit-blue-jeans',
        sku: 'SBJ-002',
        description: 'Modern skinny fit jeans in classic blue denim',
        price: 79.99,
        discountedPrice: 59.99,
        currency: 'USD',
        quantityInStock: 50,
        inStock: true,
        weight: 0.8,
        brandId: createdBrands.find(b => b.name === 'Levi\'s')?.id,
        productTypeId: createdProductTypes.find(pt => pt.name === 'Jeans')?.id,
        seoTitle: 'Skinny Fit Blue Jeans - Premium Denim',
        seoDescription: 'Stylish skinny fit jeans in classic blue. Perfect fit and comfort.',
        mainMedia: 'https://example.com/images/blue-jeans.jpg'
      }
    ];

    const createdProducts = [];
    for (const product of sampleProducts) {
      const createdProduct = await prisma.product.create({
        data: {
          ...product,
          formattedPrice: `${product.currency} ${product.price.toFixed(2)}`,
          formattedDiscountedPrice: product.discountedPrice ? `${product.currency} ${product.discountedPrice.toFixed(2)}` : null
        }
      });
      createdProducts.push(createdProduct);
    }
    console.log(`✅ Created ${createdProducts.length} sample products`);

    // Create Sample Variants
    console.log('Creating sample variants...');
    const tshirtProduct = createdProducts.find(p => p.slug === 'classic-white-t-shirt');
    const jeansProduct = createdProducts.find(p => p.slug === 'skinny-fit-blue-jeans');

    if (tshirtProduct) {
      // T-shirt variants with different colors and sizes
      const tshirtVariants = [
        {
          variantId: 'CWT-001-WHITE-S',
          sku: 'CWT-001-WHITE-S',
          fullVariantName: 'Classic White T-Shirt - White - Small',
          variantName: 'White - Small',
          choices: { size: 'S', color: 'White' },
          stock: 25,
          colorId: allColors.find(c => c.name === 'White')?.id,
          styleId: allStyles.find(s => s.name === 'Relaxed Fit T-Shirt')?.id,
          productId: tshirtProduct.id
        },
        {
          variantId: 'CWT-001-WHITE-M',
          sku: 'CWT-001-WHITE-M',
          fullVariantName: 'Classic White T-Shirt - White - Medium',
          variantName: 'White - Medium',
          choices: { size: 'M', color: 'White' },
          stock: 30,
          colorId: allColors.find(c => c.name === 'White')?.id,
          styleId: allStyles.find(s => s.name === 'Relaxed Fit T-Shirt')?.id,
          productId: tshirtProduct.id
        },
        {
          variantId: 'CWT-001-BLACK-M',
          sku: 'CWT-001-BLACK-M',
          fullVariantName: 'Classic White T-Shirt - Black - Medium',
          variantName: 'Black - Medium',
          choices: { size: 'M', color: 'Black' },
          stock: 20,
          colorId: allColors.find(c => c.name === 'Black')?.id,
          styleId: allStyles.find(s => s.name === 'Relaxed Fit T-Shirt')?.id,
          productId: tshirtProduct.id
        }
      ];

      for (const variant of tshirtVariants) {
        await prisma.productVariant.create({ data: variant });
      }
    }

    if (jeansProduct) {
      // Jeans variants with different colors and sizes
      const jeansVariants = [
        {
          variantId: 'SBJ-002-BLUE-30',
          sku: 'SBJ-002-BLUE-30',
          fullVariantName: 'Skinny Fit Blue Jeans - Blue - 30',
          variantName: 'Blue - 30',
          choices: { size: '30', color: 'Blue' },
          stock: 15,
          colorId: allColors.find(c => c.name === 'Blue')?.id,
          styleId: allStyles.find(s => s.name === 'Skinny Fit Jeans')?.id,
          productId: jeansProduct.id
        },
        {
          variantId: 'SBJ-002-BLUE-32',
          sku: 'SBJ-002-BLUE-32',
          fullVariantName: 'Skinny Fit Blue Jeans - Blue - 32',
          variantName: 'Blue - 32',
          choices: { size: '32', color: 'Blue' },
          stock: 20,
          colorId: allColors.find(c => c.name === 'Blue')?.id,
          styleId: allStyles.find(s => s.name === 'Skinny Fit Jeans')?.id,
          productId: jeansProduct.id
        },
        {
          variantId: 'SBJ-002-BLACK-32',
          sku: 'SBJ-002-BLACK-32',
          fullVariantName: 'Skinny Fit Blue Jeans - Black - 32',
          variantName: 'Black - 32',
          choices: { size: '32', color: 'Black' },
          stock: 15,
          colorId: allColors.find(c => c.name === 'Black')?.id,
          styleId: allStyles.find(s => s.name === 'Skinny Fit Jeans')?.id,
          productId: jeansProduct.id
        }
      ];

      for (const variant of jeansVariants) {
        await prisma.productVariant.create({ data: variant });
      }
    }

    console.log('✅ Created sample variants');

    console.log('🎉 Database seeding completed successfully!');
    
    // Print summary
    const counts = await Promise.all([
      prisma.color.count(),
      prisma.style.count(),
      prisma.brand.count(),
      prisma.productType.count(),
      prisma.collection.count(),
      prisma.product.count(),
      prisma.productVariant.count()
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`Colors: ${counts[0]}`);
    console.log(`Styles: ${counts[1]}`);
    console.log(`Brands: ${counts[2]}`);
    console.log(`Product Types: ${counts[3]}`);
    console.log(`Collections: ${counts[4]}`);
    console.log(`Products: ${counts[5]}`);
    console.log(`Variants: ${counts[6]}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });