/*
 * All routes for Products are defined here
 * Since this file is loaded in server.js into api/products,
 *   these routes are mounted onto /products
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const { on } = require('nodemon');
const router  = express.Router();

module.exports = (db) => {

  // VIEW ALL PRODUCTS
  router.get("/", (req, res) => {
    db.query(`
    SELECT *
    FROM products
    WHERE sold = false
    LIMIT $1;`, [8])
      .then(data => {
        const templateVars = {
          products: data.rows
        }
        
        res.render('products', templateVars);
      })
      .catch(err => {
          res.render('***', err);
      });
  });

  // VIEW PRODUCTS FILTERED BY PRICE
  router.post("/", (req, res) => {
    let queryString = `
    SELECT *
    FROM products
    WHERE sold = false
    `;
    let queryParams = [];
  
    if (req.body.minimum_price) {
      queryParams.push(req.body.minimum_price * 100);
      queryString += `\nAND price >= $${queryParams.length}`;
      
      if (req.body.maximum_price) {
        queryParams.push(req.body.maximum_price * 100);
        queryString += `\nAND price <= $${queryParams.length}\n LIMIT 8;`;
  
        return db.query(queryString, queryParams)
        .then(data => {
        const templateVars = {
          products: data.rows
        }
        res.render('products', templateVars);
        })
        .catch(err => {
          console.log(err);
        });    
      }
  
      queryString += `\nLIMIT 8;`;
      return db.query(queryString, queryParams)
      .then(data => {
      const templateVars = {
        products: data.rows
        }
        res.render('products', templateVars);
      })
      .catch(err => {
        console.log(err);
      });
    } else if (req.body.maximum_price) {
      queryParams.push(req.body.maximum_price * 100);
      queryString += `\nAND price <= $${queryParams.length}\nLIMIT 8;`;
  
      return db.query(queryString, queryParams)
      .then(data => {
      const templateVars = {
        products: data.rows
        }
      res.render('products', templateVars);
      })
      .catch(err => {
        console.log(err);
      });    
    };
  
    queryString += `\nLIMIT 8;`;
    return db.query(queryString)
    .then(data => {
      const templateVars = {
      products: data.rows
      }

      res.render('products', templateVars);
    })
    .catch(err => {
      console.log(err);
    });
  });

  // VIEW SINGLE PRODUCT
  router.get("/product/:id", (req, res) => {
    db.query(`
    SELECT *, users.name
    FROM products
    JOIN users ON products.owner_id = users.id
    WHERE products.id = $1;`,[req.params.id])
      .then(data => {
        const templateVars = {
          product: data.rows[0]
        }
        res.render("single_product", templateVars);
      })
      .catch(err => {
        res.render('***', err);
      });
  });

  // VIEW ALL PRODUCTS OF A SINGLE USER
  router.get("/user/:user_id", (req, res) => {
    db.query(`
    SELECT *
    FROM products
    JOIN users ON products.owner_id = users.id
    WHERE users.id = $1;`, [req.params.user_id])
      .then(data => {
        const products = data.rows;
        res.json({products});

        // res.render('***', products);
      })
      .catch(err => {
        res.render('***', err);
      });
    });

  // VIEW USER'S WISHLIST
  router.get("/wishlist/:user_id", (req, res) => {
    db.query(`
    SELECT *
    FROM products
    JOIN wishlists ON wishlists.product_id = products.id
    JOIN users ON wishlists.user_id = users.id
    WHERE users.id = $1;`, [req.params.user_id])
      .then(data => {
        const products = data.rows;
        res.json({products});
        // res.render('***', products);
      })
      .catch(err => {
        res.render('***', err);
      });
  });

  // ADD PRODUCT TO WISHLIST
  router.post("/products/wishlist/:user_id/add", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    INSERT INTO wishlists (user_id, product_id)
    VALUES ($1, $2)`, inputVars)
      .then(data => {
        // css toggle feature to indicate item is added to wishlist

      })
      .catch(err => {
        alert(err);
      });
  });

  // DELETE PRODUCT FROM WISHLIST
  router.post("/products/wishlist/:user_id/delete", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    DELETE FROM wishlists
    WHERE user_id = $1 AND product_id = $2
    RETURNING *`, inputVars)
      .then(data => {
        res.render('***', data);
      })
      .catch(err => {
          alert(err);
      });
  });

  // GET new product form
  router.get("/new", (req, res) => {
    res.render("new_listing");
  });

  // POST NEW PRODUCT FOR SALE
  router.post("/new", (req, res) => {
    const inputVars = [ req.body.title, /*req.body.category_id*/7, req.body.description, /*req.body.img_url*/'bla', req.body.price, /*req.params.user_id*/1];
    db.query(`
    INSERT INTO products (title, category_id, description, img_url, price, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    ;`, inputVars)
      .then(data => {
        console.log(data);
        res.redirect('/');
      })
      .catch(err => {
        alert(err);
      });
  });

  // VIEW EDIT PRODUCTS PAGE
  router.get("/products/product/:id/edit", (req, res) => {
    const inputVars = [req.params.product_id];
    db.query(`
    SELECT * FROM products
    WHERE products.id = $1`, inputVars)
      .then(data => {
        const products = data.rows[0];
        res.render('***', products);
      })
      .catch(err => {
        alert(err);
      });
  });

  // SUBMIT EDIT FORM TO EDIT PRODUCT PAGE
  router.post("/products/product/:id/edit", (req, res) => {
    const inputVars = [req.params.title, req.params.category_id, req.params.description, req.params.img_url, req.params.price, req.params.featured, req.params.sold, req.params.id ,req.params.user_id];
    db.query(`
    UPDATE products
    SET title=$1, category_id=$2, description=$3, img_url=$4, price=$5, featured=$6, sold=$7,
    WHERE products.id = $8 and owner_id = $9;)`, inputVars)
      .then(data => {
        const products = data.rows;
        res.redirect('***');
      })
      .catch(err => {
        alert(err);
      });
  });

  // DELETE A PRODUCT
  router.post("/products/product/:id/delete", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    DELETE FROM products
    WHERE user_id = $1 AND product_id = $2`, inputVars)
      .then(data => {
        // const products = data.rows;
        res.redirect('***');
      })
      .catch(err => {
        alert(err);
      });
  });

  // FILTERED PRODUCTS
  router.post("/", (req, res) => {
    let queryString = `
    SELECT *
    FROM products
    WHERE sold = false
    `;
    let queryParams = [];
  
    if (req.body.minimum_price) {
      queryParams.push(req.body.minimum_price * 100);
      queryString += `\nAND price >= $${queryParams.length}`;
      
      if (req.body.maximum_price) {
        queryParams.push(req.body.maximum_price * 100);
        queryString += `\nAND price <= $${queryParams.length}\n LIMIT 8;`;
  
        return db.query(queryString, queryParams)
        .then(data => {
        const templateVars = {
          products: data.rows
        }
        res.render('products', templateVars);
        })
        .catch(err => {
          // res.render('/r);
          alert(err);
        });    
      }
  
      queryString += `\nLIMIT 8;`;
      return db.query(queryString, queryParams)
      .then(data => {
      const templateVars = {
        products: data.rows
        }
        res.render('products', templateVars);
      })
      .catch(err => {
        // res.render('/r);
        alert(err);
      });
    } else if (req.body.maximum_price) {
      queryParams.push(req.body.maximum_price * 100);
      queryString += `\nAND price <= $${queryParams.length}\nLIMIT 8;`;
  
      return db.query(queryString, queryParams)
      .then(data => {
      const templateVars = {
        products: data.rows
        }
      res.render('products', templateVars);
      })
      .catch(err => {
        // res.render('/r);
        alert(err);
      });    
    };
  
    queryString += `\nLIMIT 8;`;
    return db.query(queryString)
    .then(data => {
      const templateVars = {
      products: data.rows
      }

      res.render('products', templateVars);
    })
    .catch(err => {
      // res.render('/r);
      console.log(err);
    });
  });

  return router;
};
