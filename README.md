# react-ka-ching
This is the code to generate a NextJS React App using WordPress JSON API

## What does this do?
I have been working on creating a complete web CMS archetecture using the greatest technologies on the web today. This will spin up a new NextJS React App complete with tooling for VSCode. It will then create a Wordpress CMS instance to manage products, images, blogs and all other CMS related data.

The WordPress installation uses WooCommerce under the hood to manage products. The NextJS App uses the WP-JSON API to get the data it needs to display on the frontend.


[Check out the WordPress code here.](https://github.com/by-rojo/react-ka-ching-wp)


[Check out the NextJS code here.](https://github.com/by-rojo/iagnmft-nodejs)


[See a complete working demo here.](https://iagnmft-nodejs.vercel.app/)


## Running

To create a new app:
`npx react-ka-ching`

To seed product data using the amazon affiliate api:
`npx react-ka-ching --seed`

To skip questions and use default answers:
`npx react-ka-ching--skip`

## TODO

[] create function to map values to client package.json
[] create function to map wordpress envs in wp-config.php
[] create function to setup wordpress with initial data (plugins etc)
[] create function to deploy to production using aws and vercel
[] add ability to pause, delete and rerun seeds