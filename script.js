const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
//main cart
let cart = [];
let buttonsDOM = [];

//getting products
class Products {
    async getProducts() { //making asynchronous JS method, making an ajax call to a local JSON file
        try {
            let result = await fetch("products.json"); //waiting for response
            let data = await result.json(); //parsed to object

            let products = data.items;
            products = products.map(item => { //destructing- pulling and assigning key, value pairs from object returned from the fetch api
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image }; //returns a nice/clean array
            })
            return products
        } catch (error) {
            console.log(error);
        }
    }
}
//display products
class UI {
    displayProducts(products) {
        let result = "";
        products.forEach(product => {
            result += `
            <article class="product">
                <div class="img-container">
                    <img src=${product.image} alt="product" class="product-img">
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fa fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            `;
        });
        productsDOM.innerHTML = result;
    }
    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")]; //spread op turns nodeList into array
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id; //grabs data-id with dataset
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", event => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;
                //get product from products
                let cartItem = { ...Storage.getProduct(id), amount: 1 };//from dataset attr.//amount = qty
                cart = [...cart, cartItem];
                //save cart in LS
                Storage.saveCart(cart)
                //set cart values
                this.setCartValues(cart);
                //display cart item
                this.addCartItem(cartItem);
                //show the cart
                this.showCart();
            });
        });
    }
    setCartValues(cart) { //cart totals
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        })
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2))
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item) {

        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
                    <img src=${item.image} alt="product">
                    <div>
                        <h4>${item.title}</h4>
                        <h5>$${item.price}</h5>
                        <span class="remove-item" data-id=${item.id}>remove</span>
                    </div>
                    <div>
                        <i class="fa fa-chevron-up" data-id=${item.id}></i>
                        <p class="item-amount">${item.amount}</p>
                        <i class="fa fa-chevron-down" data-id=${item.id}></i>
                    </div>`
        cartContent.appendChild(div);
    }
    showCart() {
        console.log("hit")
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");

    }
    setupAPP() {
        cart = Storage.getCart();//values in localstorage or empty []
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item))
    }
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }
    cartLogic() {
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();//moves this to the UI function
        })
        cartContent.addEventListener("click", (event) => { //remove item
            if (event.target.classList.contains("remove-item")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement); // traverse up the DOM to grab parent element
                this.removeItem(id);//removes only from cart not DOM
            }
            
        })
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while (cartContent.children.length > 0) { //removes all items
            cartContent.removeChild(cartContent.children[0])
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fa fa-shopping-cart"></i>add to cart`;
    }
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

//local storage
class Storage {
    static saveProducts(products) { //because it is static don't need to instantiate it
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));//return LS array
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart))
    }
    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI(); //instantiating new objects and using the methods through their prototype
    const products = new Products();
    //setup app
    ui.setupAPP();

    //get all products from json
    products
        .getProducts()
        .then(products => {
            ui.displayProducts(products); //calling method to get ajax return of JSON object
            Storage.saveProducts(products); //local storage , first would display then store to LS//static method just gets called?
        }).then(() => {
            ui.getBagButtons();
            ui.cartLogic();
        });
});