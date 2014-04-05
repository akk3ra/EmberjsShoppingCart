Sakker = Ember.Application.create({
    LOG_TRANSITIONS: true
});
Sakker.Router = Ember.Router.extend({
    location: 'hash'
});

Sakker.Router.map(function(){
    this.resource('index', {path: '/'});
    this.resource('login', {path: '/login'});
    this.resource('products', {path: '/products'});
    this.resource('product', {path: '/product/:product_id'});
    this.route('primeCheck', {path: '/primeCheck/:userId'});
    this.route('addToCart', {path: '/addToCart/:product_id'});
    this.route('finalCart', {path: '/finalCart'});
});
Sakker.IndexRoute = Ember.Route.extend({
    redirect: function(){
        this.transitionTo('login');
    }
});

Sakker.LoginRoute = Ember.Route.extend({
    model: function(){
        console.log("Transitioned into the login route...");
    }
});
Sakker.PrimeCheckRoute = Ember.Route.extend({
    beforeModel: function(transition){
        console.log("Transition value-->>"+transition);
        var primeUsers = Sakker.ReloginNotNeededUsers.create();
        var loginController = this.controllerFor('login');
        currentUser = loginController.get('userId');
        var isPrimeUser = primeUsers.recheckNeeded(currentUser);
        if(!isPrimeUser){
            console.log("User not a prime user therefore need to login again..");
            if(loginController.get('reAuthenticate')){
                //make the 'enableLogout' in the application controller to false
                this.controllerFor('application').set('enableLogout', false);
                loginController.set('previousTransition', transition);
                loginController.set('reAuthenticate', false);
                loginController.set('userId', null);
                loginController.set('password', null);
                loginController.set('checkPrimeLoginMessage', "Please login again to see the prime shipping availability");
                this.transitionTo('login');
            }
        }
    },
    model: function(prodId){
        var isPrimeProduct = Sakker.PrimeProduct.create().isPrimeProduct(prodId);
        var result = "The product is NOT eligible for prime shipping..";
        if(isPrimeProduct){
            result = "The product is eligible for prime shipping..";
        }
        // Return a POJO
        //return {"msg": result};
        return Ember.Object.create({
            msg: result
        });
    },
    renderTemplate: function(){
        console.log("Rendering the template.....");
        this.render();
        this.render('primeMsgTemp', {into: 'primeCheck', outlet: 'primeCheckOutlet'});
    }
});
// OBJECTS START
Sakker.PrimeProduct = Ember.Object.extend({
    primeProducts: ['binaca','uboat'],
    nonPrimeProducts:['casio','logitech'],
    isPrimeProduct: function(name){
        this.get('primeProducts').forEach(function(product){
            if (name===product){
                console.log("The product is eligible for prime shipping..");
                return true;
            }else{
                console.log("The product is NOT eligible for prime shipping..");
                return false;
            }
        });
    }
});
Sakker.ReloginNotNeededUsers = Ember.Object.extend({
    users: ['sandeep', 'akkeera'],
    recheckNeeded: function(userName){
    this.get('users').forEach(function(user){
        if(userName===user){
            return false;
        }else{
             return true;                                          
        }
    });
    }
});
Sakker.Product = Ember.Object.extend({
    productId: null,
    productName: null,
    productType: null,
    productCategory: null,
    productFullName: function(){
        return this.get('productName').capitalize();
    }.property('productName')
    
});
Sakker.ValidLogin = Ember.Object.extend({
    isValidLogin: true,
    isPrimeUser: false,
    isEligible: true
});
Sakker.ProductsHelper = Ember.Object.extend({
    fetchProducts: function(){
        return [Sakker.Product.create({
            productId: "binaca",
            productName: "Binaca Spraymint",
            productType: "Mouth Freshner",
            productCategory: "Misc"
        }), Sakker.Product.create({
            productId: "uboat",
            productName: "U-Boat Classic",
            productType: "Watches",
            productCategory: "Luxury wear"
        }),Sakker.Product.create({
            productId: "casio",
            productName: "Casio Illuminator",
            productType: "Watches",
            productCategory: "Regular Wear"
        }),Sakker.Product.create({
            productId: "logitech",
            productName: "Logitech Wireless M325",
            productType: "Computer Mouse",
            productCategory: "Computer Hardware"
        })];
    },
    fetchProduct: function(productId){
        var fetchProducts = this.get('fetchProducts')();
        var product = null;
        fetchProducts.forEach(function(prod){
            console.log("Fetching the product from DB-->>"+prod.get('productId'));
            if(productId===prod.get('productId')){
                console.log("Found the product looking for..");
                product = prod;
            }            
        });
        console.log('Before sending-->>'+product.get('productName'));
        return product;
    }
});
// OBJECTS END
Sakker.ProductsRoute = Ember.Route.extend({
    model: function(){
        return Sakker.ProductsHelper.create().fetchProducts();
    },
    afterModel: function(products){
        //Since the Logout Button is present in the application
        // route, its controller has to be fetched and then set.
        this.controllerFor('application').set('enableLogout', true);
    }
});
Sakker.LoginController = Ember.ObjectController.extend({
    reAuthenticate: true,
    errorMess: null,
    checkPrimeLoginMessage:null,
    userId: null,
    password: null,
    isUserLoggedIn: null,
    previousTransition: null,
    actions: {
        loginCheck: function(){
            var thisController = this;
            var loginInfo = Sakker.ValidLogin.create();
            userId = this.get('userId');
            password = this.get('password');
            console.log("User ID entered is -->>"+userId);
            console.log("Password entered-->>"+password);
            
            var isValidLogin = (userId==="sandeep"&&password==="sandeep");
            if(isValidLogin){
                console.log("Login successful for the user-->>"+userId);
              
                // Set a property to the controller so that it can be retrieved
                // later to check if the user is authenticated or not
                thisController.set('isUserLoggedIn', true);
                
                // Check to see if there is any previous transition set to
                // directly navigate to that page instead of the products overview page
                var previousTransition = thisController.get('previousTransition');
                if(previousTransition){
                    console.log("Previous transition set to -->>"+previousTransition);
                    thisController.set('previousTransition', null);
                    thisController.set('checkPrimeLoginMessage', null);
                    //With the below statement, the user will navigate to that route directly
                    previousTransition.retry();
                }else{
                    console.log('About to show the products overview page..');
                    thisController.transitionToRoute('products');
                }
            } else{
                thisController.set('errorMess', "Invalid Credentials..");
                thisController.transitionToRoute('login');
            }
            
        }
    }
    
});
Sakker.ApplicationController = Ember.ObjectController.extend({
    enableLogout: false,
    needs: ['application', 'login'],
    cartCount: null,
    actions: {
        logoutAction: function(){
            var thisController = this;
            
            //Remove the logout button from the 'application' route
            // so fetch the application controller          
            this.set('enableLogout', false);
           // thisController.set('isUserLoggedIn', false);
            //var loginController = thisController.controllerFor('login');
            var loginController = thisController.get('controllers.login');
            loginController.set('errorMess', null);
            loginController.set('userId', null);
            loginController.set('password', null);
            loginController.set('reAuthenticate', true);
            thisController.transitionToRoute('login');
            
            // Delete the cart count..
            this.set('cartCount', null);
            // Delete the items from the cart
            
            this.store.findAll('cartItem').then(function(records){
                records.forEach(function(record){
                    Ember.run.once(function(){
                        record.deleteRecord();
                        //record.save();
                    });
                });
            });
        },
        showCart: function(){

            console.log("About to show the cart items-->>");
            this.transitionToRoute('finalCart');
        }
    }
});
Sakker.ProductRoute = Ember.Route.extend({
    model: function(productId){
        //var products = Sakker.ProductsHelper.create().fetchProducts();
        console.log('About to fetch the product details-->>'+productId.product_id);
        return Sakker.ProductsHelper.create().fetchProduct(productId.product_id);
    },
    setupController: function(controller, model){
        // This property on the finalCart controller has to be set for passing
        // it to the back button link. Otherwise it will not be available for it.
        var finalCartController = this.controllerFor('finalCart');
        finalCartController.set('backButtonRemember', model.get('productId'));
        this._super(controller, model);

    }
});
Sakker.ProductController = Ember.ObjectController.extend({
    needs: ['application'],
    //cartLength: function(){

    //    return this.get('content').get('length');
    //}.property('content.length'),
    actions: {
        // This action is used to add items to the cart
        addToCartAction: function(productInfo){
            var thisController = this;
            console.log("Item going to be added to the cart...!"+productInfo.productId);
            Ember.debug("Cart length as ProductController property-->>"+this.get('cartLength'));
            //if(this.get('cartLength') < 5){
            var newCartItem = this.store.createRecord('cartItem');
                newCartItem.set('id', productInfo.get('productId'));
                newCartItem.set('productId', productInfo.get('productId'));
                newCartItem.set('productName', productInfo.get('productName'));
                newCartItem.set('productPrice', 3);
                newCartItem.set('productDesc', productInfo.get('productCategory'));                    
           
            //Save the item to commit
            //newCartItem.save();
            //newCartItem.destroy();

            Ember.debug("Product Controller: productName -->>"+productInfo.get('productName'));
            // Fetch the controller for the application template and update
            // the cart count
            var appController = this.get('controllers.application');
            Ember.debug("Application controller -->>"+appController);
            var cartContent = this.store.find('cartItem').then(function(records){
                //Ember.run.once(function(){
                    Ember.debug("Entered the promise function...");
                    appController.set('cartCount', records.get('length'));

                    // Set the cart length to this controller as well so that
                    // it will be helpfull in the above if condition for limiting
                    // the cart size to a number.
                    thisController.set('cartLength', records.get('length'));
                //});
            });  

        } 
        //}
    }
});
Sakker.FinalCartRoute = Ember.Route.extend({
    model: function(){
        return this.store.find('cartItem');

    }
});
Sakker.FinalCartController = Ember.ArrayController.extend({
    needs: ['application'],
    backButtonRemember: null,
    // This property remembers the total price of the items in the cart while they are
    // added and removed.
    totalCartPrice: function(){
        var content = this.get('content');
       var totalPrice = 0;
        content.forEach(function(cartItem){
            totalPrice = totalPrice + cartItem.get('productPrice');
        });
        Ember.debug("About to compute the total Cart Price..");
        //this.set('totalCartPrice', totalPrice); 

        return totalPrice;
    }.property('content.@each.productPrice'),
    actions: {
        // This action is used to remove items from the cart
        removeItemFromCartAction: function(productId){
            console.log("Item to be removed-->>"+productId);
            // Delete this record from the cartItem model
            var content = this.get('content');
            Ember.debug("Content length before deletion-->>"+content.get('length'));
            content.forEach(function(item){

                if(item.get('productId')===productId){
                    content.removeObject(item);
                }
            });
            // Update the cart count in the image file
            var appController = this.get('controllers.application');
            Ember.debug("Content length after deletion-->>"+content.get('length'));
            appController.set('cartCount', content.get('length'));

            //var cartItemToDelete = this.store.deleteRecord('cartItem', productId);
            //cartItemToDelete.save();
            //cartItemToDelete.save();
        },
        checkoutCart: function(){
            console.log("Cart items about to be checked out..");

            if(this.get('content').get('length') === 0){
                alert("There needs to be at least one item in the cart to check out!!");
            }else{

                //Logic to check out the cart items.
            }

        }
    }
});
Sakker.Store = DS.Store.extend({
    revision: 2,
    adapter: DS.LSAdapter
});
Sakker.CartItem = DS.Model.extend({
    productId: DS.attr('string'),
    productName: DS.attr('string'),
    productPrice: DS.attr('number'),
    productDesc: DS.attr('string')
});