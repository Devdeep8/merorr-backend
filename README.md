# Fashion Ecommerce API

A comprehensive Node.js Express API with Prisma and PostgreSQL for fashion ecommerce, featuring products, variants, colors, styles, and collections management.

## Features

- **Products Management**: Complete product catalog with SEO data, pricing, inventory, and media
- **Variants System**: Product variants with colors, styles, and custom choices
- **Fashion-Specific**: Built-in support for fashion styles (Skinny, Relaxed, Oversized, Classic) and colors
- **Collections**: Organize products and variants into collections
- **Brands & Product Types**: Categorize products by brand and type
- **Inventory Tracking**: Stock management for products and variants
- **RESTful API**: Clean, consistent API endpoints with pagination and filtering
- **Database Relations**: Proper relationships between all entities

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Ready for integration
- **Validation**: Input validation and error handling
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create a `.env` file and update the database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fashion_ecommerce?schema=public"
PORT=3000
NODE_ENV=development
API_VERSION=v1
```

3. **Set up the database**:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

4. **Start the server**:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Colors API
- `GET /api/v1/colors` - Get all colors
- `GET /api/v1/colors/:id` - Get color by ID
- `POST /api/v1/colors` - Create new color
- `PUT /api/v1/colors/:id` - Update color
- `DELETE /api/v1/colors/:id` - Delete color
- `POST /api/v1/colors/bulk` - Create multiple colors

### Styles API
- `GET /api/v1/styles` - Get all styles
- `GET /api/v1/styles/fit-types` - Get available fit types
- `GET /api/v1/styles/:id` - Get style by ID
- `POST /api/v1/styles` - Create new style
- `PUT /api/v1/styles/:id` - Update style
- `DELETE /api/v1/styles/:id` - Delete style
- `POST /api/v1/styles/bulk` - Create multiple styles

### Products API
- `GET /api/v1/products` - Get all products (with filtering, pagination)
- `GET /api/v1/products/:id` - Get product by ID
- `GET /api/v1/products/slug/:slug` - Get product by slug
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Variants API
- `GET /api/v1/variants` - Get all variants
- `GET /api/v1/variants/:id` - Get variant by ID
- `GET /api/v1/variants/product/:productId` - Get variants by product
- `POST /api/v1/variants` - Create new variant
- `PUT /api/v1/variants/:id` - Update variant
- `DELETE /api/v1/variants/:id` - Delete variant
- `PATCH /api/v1/variants/:id/stock` - Update variant stock

### Collections API
- `GET /api/v1/collections` - Get all collections
- `GET /api/v1/collections/:id` - Get collection by ID
- `POST /api/v1/collections` - Create new collection
- `PUT /api/v1/collections/:id` - Update collection
- `DELETE /api/v1/collections/:id` - Delete collection

### Brands API
- `GET /api/v1/brands` - Get all brands
- `GET /api/v1/brands/:id` - Get brand by ID
- `POST /api/v1/brands` - Create new brand
- `PUT /api/v1/brands/:id` - Update brand
- `DELETE /api/v1/brands/:id` - Delete brand

## Database Schema

### Key Models

**Product**: Main product entity with all ecommerce fields including SEO, pricing, inventory, and media.

**ProductVariant**: Product variations with color, style, and custom choices.

**Color**: Available colors with hex codes.

**Style**: Fashion styles with fit types (SKINNY, RELAXED, OVERSIZED, CLASSIC).

**Collection**: Group products and variants into collections.

**Brand**: Product brands.

**ProductType**: Product categories.

## Example API Usage

### Get All Colors
```bash
curl http://localhost:3000/api/v1/colors
```

### Get All Styles
```bash
curl http://localhost:3000/api/v1/styles
```

### Create a New Color
```bash
curl -X POST http://localhost:3000/api/v1/colors \
  -H "Content-Type: application/json" \
  -d '{"name": "Forest Green", "hexCode": "#228B22"}'
```

### Create a New Style
```bash
curl -X POST http://localhost:3000/api/v1/styles \
  -H "Content-Type: application/json" \
  -d '{"name": "Slim Fit Shirt", "fitType": "SKINNY"}'
```

### Get Products with Filtering
```bash
curl "http://localhost:3000/api/v1/products?search=jeans&inStock=true&page=1&limit=10"
```

### Create a Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cotton T-Shirt",
    "slug": "premium-cotton-t-shirt",
    "sku": "PCT-001",
    "description": "High-quality cotton t-shirt",
    "price": 39.99,
    "currency": "USD",
    "quantityInStock": 100,
    "inStock": true
  }'
```

### Create a Product Variant
```bash
curl -X POST http://localhost:3000/api/v1/variants \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "PCT-001-RED-M",
    "sku": "PCT-001-RED-M",
    "fullVariantName": "Premium Cotton T-Shirt - Red - Medium",
    "variantName": "Red - Medium",
    "choices": {"size": "M", "color": "Red"},
    "stock": 25,
    "productId": "PRODUCT_ID_HERE",
    "colorId": "COLOR_ID_HERE",
    "styleId": "STYLE_ID_HERE"
  }'
```

## Fashion-Specific Features

### Fit Types
The system supports four fit types for fashion items:
- **SKINNY**: Tight-fitting styles
- **RELAXED**: Loose, comfortable fits
- **OVERSIZED**: Extra loose, trendy fits
- **CLASSIC**: Traditional, standard fits

### Color Management
- Store colors with names and hex codes
- Associate colors with product variants
- Track color usage across products

### Style Management
- Define styles with specific fit types
- Associate styles with product variants
- Organize products by fashion styles

## Development

### Database Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Project Structure
```
src/
├── routes/          # API route handlers
├── utils/           # Utility functions
├── seed.js          # Database seeding
└── server.js        # Main server file
prisma/
└── schema.prisma    # Database schema
```

## Health Check

Check if the API is running:
```bash
curl http://localhost:3000/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.