/*
 * All routes for Products are defined here
 * Since this file is loaded in server.js into api/products,
 *   these routes are mounted onto /products
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const { on } = require('nodemon');
const router  = express.Router();
const { getCategoryID } = require('../public/scripts/selectCategory')

module.exports = (db) => {

  // VIEW ALL PRODUCTS
  router.get("/", (req, res) => {
    db.query(`
    SELECT *
    FROM products
    WHERE sold = false
    LIMIT 4;`)
      .then(data => {
        console.log(data.rows);
        const templateVars = {
          products: data.rows
        }
        res.render('products', templateVars);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
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
    SELECT *
    FROM products
    WHERE products.id = $1;`,[req.params.id])
      .then(data => {
        const products = data.rows[0];
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // VIEW ALL PRODUCTS OF A SINGLE USER
  router.get("/user/:user_id", (req, res) => {
    db.query(`
    SELECT products.id, products.title, products.category_id, products.listed_on
    FROM products
    JOIN users ON products.owner_id = users.id
    WHERE users.id = $1;`, [req.params.user_id])
      .then(data => {
        const products = data.rows;
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
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
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // [] post /products/whishlist/:user_id/add // add a product to wishlist
  // ADD PRODUCT TO WISHLIST
  router.post("/products/wishlist/:user_id/add", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    INSERT INTO wishlists (user_id, product_id)
    VALUES ($1, $2)`, inputVars)
      .then(data => {
        const products = data.rows;
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // [] delete /products/whishlist/:user_id/delete // delete a product from wishlist
  // DELETE PRODUCT FROM WISHLIST
  router.post("/products/wishlist/:user_id/delete", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    DELETE FROM wishlists
    WHERE user_id = $1 AND product_id = $2`, inputVars)
      .then(data => {
        const products = data.rows;
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // POST NEW PRODUCT FOR SALE
  // GET new product form
  router.get("/new", (req, res) => {
    const templateVars = {
      user_id: 1,
      userName: 'Adam'
    }
    res.render("new_listing", templateVars);
  });

  // [] post /products/new //listing new product
  router.post("/new", (req, res) => {

    const getTime = new Date(Date.now());

    const inputVars = [ req.body.title, getCategoryID(req.body.category), req.body.description, req.body.img_url, req.body.price, req.body.featured, /*req.params.user_id*/1, getTime];
    db.query(`
    INSERT INTO products (title, category_id, description, img_url, price, featured, owner_id, listed_on)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;`, inputVars)
      .then(data => {
        res.redirect('../products/user/1'); // HARDCODED USER ID !!!!
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // [] get /products/product/:id/edit // edit product form
  // VIEW EDIT PRODUCTS PAGE
  router.get("/products/product/:id/edit", (req, res) => {
    const inputVars = [req.params.product_id];
    db.query(`
    SELECT * FROM products
    WHERE products.id = $1`, inputVars)
      .then(data => {
        const products = data.rows[0];
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // [] post /products/product/:id/edit //edit a product submit
  // SUBMIT EDIT FORM TO EDIT PRODUCT PAGE
  router.post("/products/product/:id/edit", (req, res) => {
    const inputVars = [req.params.title, req.params.category_id, req.params.description, req.params.img_url, req.params.price, req.params.featured, req.params.sold, req.params.id ,req.params.user_id];
    db.query(`
    UPDATE products
    SET title=$1, category_id=$2, description=$3, img_url=$4, price=$5, featured=$6, sold=$7,
    WHERE products.id = $8 and owner_id = $9;)`, inputVars)
      .then(data => {
        const products = data.rows;
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // [] delete /products/product/:id/delete //delete a product
  // DELETE A PRODUCT
  router.post("/products/product/:id/delete", (req, res) => {
    const inputVars = [req.params.user_id, req.params.product_id]
    db.query(`
    DELETE FROM products
    WHERE user_id = $1 AND product_id = $2`, inputVars)
      .then(data => {
        const products = data.rows;
        res.json({ products });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
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
