const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/styles - Get all styles
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, fitType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    if (fitType) {
      where.fitType = fitType.toUpperCase();
    }

    const [styles, total] = await Promise.all([
      prisma.style.findMany({
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
      prisma.style.count({ where })
    ]);

    res.json({
      success: true,
      data: styles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch styles',
      message: error.message
    });
  }
});



// GET /api/v1/styles/fit-types - Get all available fit types
router.get('/fit-types', async (req, res) => {
  try {
    const fitTypes = ['SKINNY', 'RELAXED', 'OVERSIZED', 'CLASSIC'];
    
    res.json({
      success: true,
      data: fitTypes
    });
  } catch (error) {
    console.error('Error fetching fit types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fit types',
      message: error.message
    });
  }
});

// GET /api/v1/styles/:id - Get style by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const style = await prisma.style.findUnique({
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

    if (!style) {
      return res.status(404).json({
        success: false,
        error: 'Style not found'
      });
    }

    res.json({
      success: true,
      data: style
    });
  } catch (error) {
    console.error('Error fetching style:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch style',
      message: error.message
    });
  }
});

// POST /api/v1/styles - Create new style
router.post('/', async (req, res) => {
  try {
    const { name, fitType } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Style name is required'
      });
    }

    if (!fitType) {
      return res.status(400).json({
        success: false,
        error: 'Fit type is required'
      });
    }

    const validFitTypes = ['SKINNY', 'RELAXED', 'OVERSIZED', 'CLASSIC'];
    if (!validFitTypes.includes(fitType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fit type. Must be one of: SKINNY, RELAXED, OVERSIZED, CLASSIC'
      });
    }

    const style = await prisma.style.create({
      data: {
        name: name.trim(),
        fitType: fitType.toUpperCase()
      }
    });

    res.status(201).json({
      success: true,
      data: style,
      message: 'Style created successfully'
    });
  } catch (error) {
    console.error('Error creating style:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Style name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create style',
      message: error.message
    });
  }
});

// PUT /api/v1/styles/:id - Update style
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fitType } = req.body;

    const existingStyle = await prisma.style.findUnique({
      where: { id }
    });

    if (!existingStyle) {
      return res.status(404).json({
        success: false,
        error: 'Style not found'
      });
    }

    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (fitType !== undefined) {
      const validFitTypes = ['SKINNY', 'RELAXED', 'OVERSIZED', 'CLASSIC'];
      if (!validFitTypes.includes(fitType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid fit type. Must be one of: SKINNY, RELAXED, OVERSIZED, CLASSIC'
        });
      }
      updateData.fitType = fitType.toUpperCase();
    }

    const style = await prisma.style.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: style,
      message: 'Style updated successfully'
    });
  } catch (error) {
    console.error('Error updating style:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Style name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update style',
      message: error.message
    });
  }
});

// DELETE /api/v1/styles/:id - Delete style
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingStyle = await prisma.style.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true
          }
        }
      }
    });

    if (!existingStyle) {
      return res.status(404).json({
        success: false,
        error: 'Style not found'
      });
    }

    if (existingStyle._count.variants > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete style that is used by product variants'
      });
    }

    await prisma.style.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Style deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting style:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete style',
      message: error.message
    });
  }
});

// POST /api/v1/styles/bulk - Create multiple styles
router.post('/bulk', async (req, res) => {
  try {
    const { styles } = req.body;

    if (!Array.isArray(styles) || styles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Styles array is required'
      });
    }

    const validFitTypes = ['SKINNY', 'RELAXED', 'OVERSIZED', 'CLASSIC'];
    const validStyles = styles.filter(style => 
      style.name?.trim() && 
      style.fitType && 
      validFitTypes.includes(style.fitType.toUpperCase())
    );
    
    if (validStyles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one valid style with name and fitType is required'
      });
    }

    const createdStyles = await prisma.style.createMany({
      data: validStyles.map(style => ({
        name: style.name.trim(),
        fitType: style.fitType.toUpperCase()
      })),
      skipDuplicates: true
    });

    res.status(201).json({
      success: true,
      data: { count: createdStyles.count },
      message: `${createdStyles.count} styles created successfully`
    });
  } catch (error) {
    console.error('Error creating styles in bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create styles',
      message: error.message
    });
  }
});

module.exports = router;