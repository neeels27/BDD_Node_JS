const http = require('http');
const url = require('url');
const fs = require('fs');

let data = [];
let lastId = 0;

try {
  data = JSON.parse(fs.readFileSync('database.json'));
} catch (err) {
  console.error('Error reading database file:', err);
}

function findById(id) {
  return data.find(item => item.id === id);
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  switch (method) {
    case 'GET':
      if (path === '/') {
        // Renvoyer la liste complète des éléments
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } else if (path.startsWith('/items/')) {
        // Renvoyer un élément spécifique en fonction de son ID
        const id = parseInt(path.split('/')[2]);
        const item = findById(id);
        if (item) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(item));
        } else {
          res.statusCode = 404;
          res.end();
        }
      } else {
        // Renvoyer une erreur si l'URL est incorrecte
        res.statusCode = 404;
        res.end();
      }
      break;
      case 'POST':
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
            const item = JSON.parse(body);
            lastId = 0;
            item.id = ++lastId;
            fs.writeFileSync('database'+ Date.now() +'.json', JSON.stringify(item));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(item));
        });
        break;
    
        case 'PUT':
          // Modifier un élément existant dans la liste
          const id = parseInt(path.split('/')[2]);
          const item = findById(id);
          if (item) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              const updated = JSON.parse(body);
              data[data.indexOf(item)] = updated;
              fs.writeFileSync('database.json', JSON.stringify(data));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(updated));
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
          break;
        case 'DELETE':
          // Supprimer un élément de la liste
          const itemId = parseInt(path.split('/')[2]);
          const foundItem = findById(itemId);
          if (foundItem) {
            data.splice(data.indexOf(foundItem), 1);
            fs.writeFileSync('database.json', JSON.stringify(data));
            res.end();
          } else {
            res.statusCode = 404;
            res.end();
          }
          break;
    }
  }
  
  const server = http.createServer(handleRequest);
  
  server.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
  