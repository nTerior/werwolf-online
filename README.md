# template-webapp
A template for webapps

## How to use
1. Fork this repository
2. Create a new repository using this template repository
3.
```bash
# Clone/Copy your forked repository
git clone <your repository url>
cd <your repository name>

# Install all the dependencies using nodejs/npm
npm i
```
4. Code

### Create a favicon
#### From a .png file
```bash
# Moving the png image to the required directory
cd public
mkdir assets
cp <your png name>.png assets/icon.png

# Creating the favicon
chmod +x build-favicon.sh
./build-favicon.sh
```

#### From an .ico file
```bash
# Moving the favicon to the required directory
cd public
mkdir assets
cp <your icon name>.ico assets/favicon.ico
```

### Debugging
`nodemon`

### Running
`ts-node --project tsconfig.server.json ./src/server/index.ts`

## Dependencies
- NodeJS
- npm
  - nodemon
  - typescript
