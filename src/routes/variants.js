const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/variants - Get all variants
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      productId, 
      colorId, 
      styleId,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { variantName: { contains: search, mode: 'insensitive' } },
        { fullVariantName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Product filter
    if (productId) {
      where.productId = productId;
    }

    // Color filter
    if (colorId) {
      where.colorId = colorId;
    }

    // Style filter
    if (styleId) {
      where.styleId = styleId;
    }

    // Stock filter
    if (inStock !== undefined) {
      where.stock = inStock === 'true' ? { gt: 0 } : { lte: 0 };
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              currency: true
            }
          },
          color: true,
          style: true,
          collections: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.productVariant.count({ where })
    ]);

    res.json({
      success: true,
      data: variants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variants',
      message: error.message
    });
  }
});

// GET /api/v1/variants/:id - Get variant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
        color: true,
        style: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variant',
      message: error.message
    });
  }
});

// GET /api/v1/variants/product/:productId - Get variants by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { colorId, styleId } = req.query;

    const where = { productId };
    
    if (colorId) where.colorId = colorId;
    if (styleId) where.styleId = styleId;

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        color: true,
        style: true,
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        variantName: 'asc'
      }
    });

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product variants',
      message: error.message
    });
  }
});

// POST /api/v1/variants - Create new variant
router.post('/', async (req, res) => {
  try {
    const {
      variantId,
      sku,
      fullVariantName,
      variantName,
      choices,
      stock = 0,
      managedVariant = true,
      variantMedia,
      colorId,
      styleId,
      productId,
      collectionIds = []
    } = req.body;

    // Validation
    if (!variantId || !sku || !fullVariantName || !variantName || !productId) {
      return res.status(400).json({
        success: false,
        error: 'VariantId, SKU, fullVariantName, variantName, and productId are required'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Create variant with collections
    const variant = await prisma.productVariant.create({
      data: {
        variantId: variantId.trim(),
        sku: sku.trim(),
        fullVariantName: fullVariantName.trim(),
        variantName: variantName.trim(),
        choices,
        stock: parseInt(stock),
        managedVariant,
        variantMedia,
        colorId: colorId || null,
        styleId: styleId || null,
        productId,
        collections: {
          create: collectionIds.map(collectionId => ({
            collectionId
          }))
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        color: true,
        style: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: variant,
      message: 'Variant created successfully'
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Variant with this variantId or SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create variant',
      message: error.message
    });
  }
});

// PUT /api/v1/variants/:id - Update variant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove collections from updateData as we'll handle it separately
    const { collectionIds, ...variantData } = updateData;

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    // Update variant
    const variant = await prisma.productVariant.update({
      where: { id },
      data: variantData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        color: true,
        style: true,
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
      await prisma.variantCollection.deleteMany({
        where: { variantId: id }
      });

      // Add new collections
      if (collectionIds.length > 0) {
        await prisma.variantCollection.createMany({
          data: collectionIds.map(collectionId => ({
            variantId: id,
            collectionId
          }))
        });
      }
    }

    // Fetch updated variant with collections
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        color: true,
        style: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedVariant,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Variant with this variantId or SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update variant',
      message: error.message
    });
  }
});

// DELETE /api/v1/variants/:id - Delete variant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    await prisma.productVariant.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete variant',
      message: error.message
    });
  }
});

// PATCH /api/v1/variants/:id/stock - Update variant stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body;

    if (stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Stock value is required'
      });
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    let newStock;
    switch (operation) {
      case 'add':
        newStock = existingVariant.stock + parseInt(stock);
        break;
      case 'subtract':
        newStock = Math.max(0, existingVariant.stock - parseInt(stock));
        break;
      case 'set':
      default:
        newStock = parseInt(stock);
        break;
    }

    const variant = await prisma.productVariant.update({
      where: { id },
      data: { stock: newStock },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        color: true,
        style: true
      }
    });

    res.json({
      success: true,
      data: variant,
      message: 'Variant stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update variant stock',
      message: error.message
    });
  }
});

module.exports = router;