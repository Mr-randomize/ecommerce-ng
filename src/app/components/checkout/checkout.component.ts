import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ShopFormService} from '../../services/shop-form.service';
import {Country} from '../../common/country';
import {State} from '../../common/state';
import {ShopValidators} from '../../validators/shop-validators';
import {CartService} from '../../services/cart.service';
import {CheckoutService} from '../../services/checkout.service';
import {Router} from '@angular/router';
import {Order} from '../../common/order';
import {OrderItem} from '../../common/order-item';
import {Purchase} from '../../common/purchase';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  constructor(private formBuilder: FormBuilder,
              private shopFormService: ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router) {
  }

  ngOnInit(): void {

    this.reviewCartDetails();

    // read the user's email address from browser storage
    const theEmail = JSON.parse(this.storage.getItem('userEmail'));

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),

        lastName: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),

        email: new FormControl(theEmail,
          [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        country: new FormControl('',
          [Validators.required]),
        street: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),
        city: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),
        state: new FormControl('',
          [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace])
      }),
      billingAddress: this.formBuilder.group({
        country: new FormControl('',
          [Validators.required]),
        street: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),
        city: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),
        state: new FormControl('',
          [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('',
          [Validators.required]),
        nameOnCard: new FormControl('',
          [Validators.required,
            Validators.minLength(2),
            ShopValidators.notOnlyWhitespace]),
        cardNumber: new FormControl('',
          [Validators.required,
            Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('',
          [Validators.required,
            Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    });

    // populate credit card month
    const startMonth: number = new Date().getMonth() + 1;
    this.shopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log('Retrieved credit card months: ' + JSON.stringify(data));
        this.creditCardMonths = data;

      });
    // populate credit card years
    this.shopFormService.getCreditCardYears().subscribe(
      data => {
        console.log('Retrieved credit card years: ' + JSON.stringify(data));
        this.creditCardYears = data;

      });

    // populate countries
    this.shopFormService.getCountries().subscribe(
      data => {
        console.log('Retrieved countries: ' + JSON.stringify(data));
        this.countries = data;
      }
    );
  }

  onSubmit(): void {

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    const cartItems = this.cartService.cartItems;
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    let purchase = new Purchase();

    purchase.customer = this.checkoutFormGroup.controls.customer.value;

    purchase.shippingAddress = this.checkoutFormGroup.controls.shippingAddress.value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    purchase.billingAddress = this.checkoutFormGroup.controls.billingAddress.value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    purchase.order = order;
    purchase.orderItems = orderItems;

    this.checkoutService.placeOrder(purchase).subscribe({
      next: response => {
        alert(`Your order has been recieved.\nOrder tracking number: ${response.orderTrackingNumber}`);

        this.resetCart();
      },
      error: err => {
        alert(`There was an error: ${err.message}`);
      }
    });

  }

  get firstName(): AbstractControl {
    return this.checkoutFormGroup.get('customer.firstName');
  }

  get lastName(): AbstractControl {
    return this.checkoutFormGroup.get('customer.lastName');
  }

  get email(): AbstractControl {
    return this.checkoutFormGroup.get('customer.email');
  }

  get shippingAddressStreet(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.street');
  }

  get shippingAddressCity(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.city');
  }

  get shippingAddressZipCode(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.zipCode');
  }

  get shippingAddressCountry(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.country');
  }

  get shippingAddressState(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.state');
  }


  get billingAddressStreet(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.street');
  }

  get billingAddressCity(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.city');
  }

  get billingAddressZipCode(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.zipCode');
  }

  get billingAddressCountry(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.country');
  }

  get billingAddressState(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.state');
  }

  get creditCardType(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.cardType');
  }

  get creditCardNameOnCard(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.nameOnCard');
  }

  get creditCardNumber(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.cardNumber');
  }

  get creditCardSecurityCode(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.securityCode');
  }


  copyShippingAddressToBillingAddress(event): void {
    if (event.target.checked) {
      this.checkoutFormGroup.controls.billingAddress
        .setValue(this.checkoutFormGroup.controls.shippingAddress.value);

      // bug fix for states
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkoutFormGroup.controls.billingAddress.reset();
      this.billingAddressStates = [];
    }
  }

  handleMonthsAndYears(): void {
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup.value.expirationYear);

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.shopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log('Retrieved credit card months: ' + JSON.stringify(data));
        this.creditCardMonths = data;
      });
  }

  getStates(formGroupName: string): void {

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.shopFormService.getStates(countryCode).subscribe(
      data => {
        if (formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data;
        } else {
          this.billingAddressStates = data;
        }

        // select first item bu default
        formGroup.get('state').setValue(data[0]);
      }
    );
  }

  private reviewCartDetails(): void {

    // subscribe to cartService
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );
  }

  private resetCart(): void {
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    this.checkoutFormGroup.reset();

    // clear data from storage
    this.storage.removeItem('cartItems');

    this.router.navigateByUrl('/products');

  }
}
