const http = require('http');
const url = require('url');
const fs = require('fs');
const crypto = require ('crypto');

let data = [];

try {
  data = JSON.parse(fs.readFileSync('BDD.json'));
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
    const id = parseInt(path.split('/')[2]);

    function searchItems(query) {
      const lowerQuery = query.toLowerCase();
      return data.filter(item => {
          for (let key in item) {
              if (item[key].toString().toLowerCase().includes(lowerQuery)) {
                  return true;
              }
          }
          return false;
      });
  }
  switch (method) {
    case 'GET':
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, DELETE"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Content-Type, X-Auth-Token"
      );
      if (path === '/') {
        // Renvoyer la liste complète des éléments
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } else if (path.startsWith('/items/')) {
        // Renvoyer un élément spécifique en fonction de son ID
        // const id = parseInt(path.split('/')[2]);
        const lowerId = id.toString().toLowerCase();
        // const item = findById(lowerId);      
        const item = findById(path.split('/')[2]);  
        if (item) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(item));
        } else {
          res.statusCode = 404;
          res.end();
        }
      } else if(path.startsWith('/search')) {
        // Rechercher les éléments qui correspondent à la requête
        const searchQuery = query.q;
        const searchResults = searchItems(searchQuery);
        if (searchResults) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(searchResults));
        } else {
          res.statusCode = 404;
          res.end();
        }
      }
      else {
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
            let lastId = 0;
            const item = JSON.parse(body);
            item.id = crypto.randomBytes(16).toString('hex');
            data.push(item);
            fs.writeFileSync('database'+ Date.now() +'.json', JSON.stringify(data));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(item));
        });
        break;

        case 'PUT':
          // Trouver l'élément existant par son ID
          const item = findById(path.split('/')[2]);
          if (item) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              const updated = JSON.parse(body);
              // Utiliser l'opérateur spread pour combiner les propriétés de l'objet existant avec les propriétés mises à jour
              const newItem = {...item, ...updated};
              data[data.indexOf(item)] = newItem;
              fs.writeFileSync('BDD.json', JSON.stringify(data));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(newItem));
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
            fs.writeFileSync('BDD.json', JSON.stringify(data));
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

  //uniquement boolean, int, string
//mettre des objets au lieu du tableau pour avoir l'idée du fichier