const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/collections - Get all collections
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              products: true,
              variants: true
            }
          }
        }
      }),
      prisma.collection.count({ where })
    ]);

    res.json({
      success: true,
      data: collections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collections',
      message: error.message
    });
  }
});

// GET /api/v1/collections/:id - Get collection by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                brand: true,
                productType: true
              }
            }
          }
        },
        variants: {
          include: {
            variant: {
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
            }
          }
        },
        _count: {
          select: {
            products: true,
            variants: true
          }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection',
      message: error.message
    });
  }
});

// POST /api/v1/collections - Create new collection
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Collection name is required'
      });
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim()
      }
    });

    res.status(201).json({
      success: true,
      data: collection,
      message: 'Collection created successfully'
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Collection name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create collection',
      message: error.message
    });
  }
});

// PUT /api/v1/collections/:id - Update collection
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingCollection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: collection,
      message: 'Collection updated successfully'
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Collection name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update collection',
      message: error.message
    });
  }
});

// DELETE /api/v1/collections/:id - Delete collection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingCollection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            variants: true
          }
        }
      }
    });

    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    if (existingCollection._count.products > 0 || existingCollection._count.variants > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete collection that contains products or variants'
      });
    }

    await prisma.collection.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete collection',
      message: error.message
    });
  }
});

module.exports = router;