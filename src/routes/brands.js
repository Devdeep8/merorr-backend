const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/brands - Get all brands
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    } : {};

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.brand.count({ where })
    ]);

    res.json({
      success: true,
      data: brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message
    });
  }
});

// GET /api/v1/brands/:id - Get brand by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            currency: true,
            mainMedia: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand',
      message: error.message
    });
  }
});

// POST /api/v1/brands - Create new brand
router.post('/', async (req, res) => {
  try {
    const { name, logo } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        logo: logo?.trim()
      }
    });

    res.status(201).json({
      success: true,
      data: brand,
      message: 'Brand created successfully'
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Brand name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create brand',
      message: error.message
    });
  }
});

// PUT /api/v1/brands/:id - Update brand
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo } = req.body;

    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (logo !== undefined) updateData.logo = logo?.trim();

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: brand,
      message: 'Brand updated successfully'
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Brand name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update brand',
      message: error.message
    });
  }
});

// DELETE /api/v1/brands/:id - Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    if (existingBrand._count.products > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete brand that has products'
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete brand',
      message: error.message
    });
  }
});

module.exports = router;