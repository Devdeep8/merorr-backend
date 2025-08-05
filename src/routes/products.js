const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      brandId, 
      productTypeId, 
      inStock, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Brand filter
    if (brandId) {
      where.brandId = brandId;
    }

    // Product type filter
    if (productTypeId) {
      where.productTypeId = productTypeId;
    }

    // Stock filter
    if (inStock !== undefined) {
      where.inStock = inStock === 'true';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          brand: {
            select: {
              id: true,
              name: true
            }
          },
          productType: {
            select: {
              id: true,
              name: true
            }
          },
          variants: {
            include: {
              color: true,
              style: true
            }
          },
          collections: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              variants: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        productType: true,
        variants: {
          include: {
            color: true,
            style: true,
            collections: {
              include: {
                collection: true
              }
            }
          }
        },
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// GET /api/v1/products/slug/:slug - Get product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        productType: true,
        variants: {
          include: {
            color: true,
            style: true,
            collections: {
              include: {
                collection: true
              }
            }
          }
        },
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// POST /api/v1/products - Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      description,
      price,
      discountedPrice,
      pricePerUnit,
      currency = 'USD',
      quantityInStock = 0,
      inStock = true,
      weight,
      trackInventory = true,
      manageVariants = false,
      productPageUrl,
      seoTitle,
      seoDescription,
      seoKeywords,
      mainMedia,
      mediaItems,
      additionalInfoSections,
      customTextFields,
      productOptions,
      ribbons,
      discount,
      brandId,
      productTypeId,
      collectionIds = []
    } = req.body;

    // Validation
    if (!name || !slug || !sku || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name, slug, SKU, and price are required'
      });
    }

    // Create product with collections
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        description: description?.trim(),
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        formattedPrice: `${currency} ${parseFloat(price).toFixed(2)}`,
        formattedDiscountedPrice: discountedPrice ? `${currency} ${parseFloat(discountedPrice).toFixed(2)}` : null,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        formattedPricePerUnit: pricePerUnit ? `${currency} ${parseFloat(pricePerUnit).toFixed(2)}` : null,
        currency,
        quantityInStock: parseInt(quantityInStock),
        inStock,
        weight: weight ? parseFloat(weight) : null,
        trackInventory,
        manageVariants,
        productPageUrl: productPageUrl?.trim(),
        seoTitle: seoTitle?.trim(),
        seoDescription: seoDescription?.trim(),
        seoKeywords: seoKeywords?.trim(),
        mainMedia: mainMedia?.trim(),
        mediaItems,
        additionalInfoSections,
        customTextFields,
        productOptions,
        ribbons,
        discount,
        brandId: brandId || null,
        productTypeId: productTypeId || null,
        collections: {
          create: collectionIds.map(collectionId => ({
            collectionId
          }))
        }
      },
      include: {
        brand: true,
        productType: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Product with this slug or SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// PUT /api/v1/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove collections from updateData as we'll handle it separately
    const { collectionIds, ...productData } = updateData;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Format price fields if they exist
    if (productData.price) {
      productData.price = parseFloat(productData.price);
      productData.formattedPrice = `${productData.currency || existingProduct.currency} ${productData.price.toFixed(2)}`;
    }

    if (productData.discountedPrice) {
      productData.discountedPrice = parseFloat(productData.discountedPrice);
      productData.formattedDiscountedPrice = `${productData.currency || existingProduct.currency} ${productData.discountedPrice.toFixed(2)}`;
    }

    if (productData.pricePerUnit) {
      productData.pricePerUnit = parseFloat(productData.pricePerUnit);
      productData.formattedPricePerUnit = `${productData.currency || existingProduct.currency} ${productData.pricePerUnit.toFixed(2)}`;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        brand: true,
        productType: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    // Update collections if provided
    if (collectionIds !== undefined) {
      // Remove existing collections
      await prisma.productCollection.deleteMany({
        where: { productId: id }
      });

      // Add new collections
      if (collectionIds.length > 0) {
        await prisma.productCollection.createMany({
          data: collectionIds.map(collectionId => ({
            productId: id,
            collectionId
          }))
        });
      }
    }

    // Fetch updated product with collections
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        productType: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Product with this slug or SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

module.exports = router;