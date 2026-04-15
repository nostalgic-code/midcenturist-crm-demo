Backend 

l dont have users table as users wont sign in 

so we use 

Security without login — guest checkout
This is actually standard for e-commerce and very doable securely. Here's how you handle it:

HTTPS everywhere — Render and Vercel both handle this automatically, non-negotiable
CSRF protection — Flask-WTF handles this on all form submissions including checkout
Rate limiting — Flask-Limiter on your API endpoints so nobody can spam orders or scrape your product data
Input validation — sanitise everything coming into the Flask API, never trust frontend data
Payment security — PayFast and Yoco handle the actual card data, it never touches your server. You just receive a confirmation webhook. This is the biggest security win
Cart security — cart lives in the browser (localStorage or cookies) with a server-side session token to validate at checkout. No account needed
Secure headers — Flask-Talisman adds security headers automatically

The guest checkout model is actually safer in some ways because you're not storing passwords that can be leaked.  

thats how users check out 

products table

product name , decription , category


product variants table  = price, sale price 

product_id , price , sale price , 

carts 

id , session id , created at , updated at 

cart_items 



orders 

id , status : enum (pending, paid , shipped , delivered , cancelled),
total amount , billing address , shipping address , collection address,created at 

order_items 

id, order_id : uuid, product variant id , quantity  , price at purchase : numeric (10,2)

payments 


id , order id , method : enum (peaches  , payfast), status : enum (initiated, completed, failed) , paid_at: timestamp, transaction_id string (nullable)

categories 
name , slug, parent_id 

living room , dining room , bedroom , decor elements , creative workspaces (office), outdoor. 


product images 

id, product_id , variant_id , url: string, sort_order : int default 0 // for gallery ordering 
is_primary:boolean 

reviews 

id , product id , rating , comment , created at, 


collections for products that can be part of multiple collections 

id , name , slug , created at




