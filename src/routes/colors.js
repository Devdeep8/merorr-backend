const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/colors - Get all colors
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

    const [colors, total] = await Promise.all([
      prisma.color.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              variants: true
            }
          }
        }
      }),
      prisma.color.count({ where })
    ]);

    res.json({
      success: true,
      data: colors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colors',
      message: error.message
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    const colors = await prisma.color.findMany();
    res.json({
      success: true,
      data: colors,
    });
  } catch (error) {
    console.error("Error fetching colors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch colors",
      message: error.message,
    });
  }
});

// GET /api/v1/colors/:id - Get color by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const color = await prisma.color.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true
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
    });

    if (!color) {
      return res.status(404).json({
        success: false,
        error: 'Color not found'
      });
    }

    res.json({
      success: true,
      data: color
    });
  } catch (error) {
    console.error('Error fetching color:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch color',
      message: error.message
    });
  }
});

// POST /api/v1/colors - Create new color
router.post('/', async (req, res) => {
  try {
    const { name, hexCode } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Color name is required'
      });
    }

    const color = await prisma.color.create({
      data: {
        name: name.trim(),
        hexCode: hexCode?.trim() || null
      }
    });

    res.status(201).json({
      success: true,
      data: color,
      message: 'Color created successfully'
    });
  } catch (error) {
    console.error('Error creating color:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Color name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create color',
      message: error.message
    });
  }
});

// PUT /api/v1/colors/:id - Update color
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, hexCode } = req.body;

    const existingColor = await prisma.color.findUnique({
      where: { id }
    });

    if (!existingColor) {
      return res.status(404).json({
        success: false,
        error: 'Color not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (hexCode !== undefined) updateData.hexCode = hexCode?.trim() || null;

    const color = await prisma.color.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: color,
      message: 'Color updated successfully'
    });
  } catch (error) {
    console.error('Error updating color:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Color name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update color',
      message: error.message
    });
  }
});

// DELETE /api/v1/colors/:id - Delete color
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingColor = await prisma.color.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true
          }
        }
      }
    });

    if (!existingColor) {
      return res.status(404).json({
        success: false,
        error: 'Color not found'
      });
    }

    if (existingColor._count.variants > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete color that is used by product variants'
      });
    }

    await prisma.color.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Color deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete color',
      message: error.message
    });
  }
});

// POST /api/v1/colors/bulk - Create multiple colors
router.post('/bulk', async (req, res) => {
  try {
    const { colors } = req.body;

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Colors array is required'
      });
    }

    const validColors = colors.filter(color => color.name?.trim());
    
    if (validColors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one valid color with name is required'
      });
    }

    const createdColors = await prisma.color.createMany({
      data: validColors.map(color => ({
        name: color.name.trim(),
        hexCode: color.hexCode?.trim() || null
      })),
      skipDuplicates: true
    });

    res.status(201).json({
      success: true,
      data: { count: createdColors.count },
      message: `${createdColors.count} colors created successfully`
    });
  } catch (error) {
    console.error('Error creating colors in bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create colors',
      message: error.message
    });
  }
});

module.exports = router;