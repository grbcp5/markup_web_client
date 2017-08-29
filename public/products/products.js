

var addProductsHandler = function( currentUser ) {

  if( currentUser.adminStatus !== userAdminStates.ADMIN )
    return;

  var barcodeNumber = prompt( "Barcode Number: " );

  if( barcodeNumber == null ) {
    location.reload();
    return;
  }

  productPath = "/markup/products/" + barcodeNumber;
  productRef = ref.child( productPath );
  productRef.once( "value", function( productSnap ) {

    var changes = {};

    if( productSnap.exists() ) {
      changes[ productPath + "/quantity" ]  = productSnap.val().quantity + 1;
    } else {

      var addNewItem = confirm( "This item is not currently in the database.\n\nWould you like to add it now?" );
      if( !addNewItem ) {
        this.skip = true;
        return;
      }

      var newItemDescription = pareprompt( "Enter a description of the item:" );
      if( newItemDescription == null ) {
        this.skip = true;
        return;
      }

      var newItemPrice = parseInt( prompt( "Enter the price of the new item:" ) );
      if( newItemPrice == null ) {
        this.skip = true;
        return;
      }

      var newItem = {
        "description": newItemDescription,
        "price": newItemPrice,
        "barcodeNumber": barcodeNumber,
        "quantity": 1
      }
      changes[ productPath ] = newItem;

    }

    ref.update( changes );

  } ).then( function( productSnap ) {

    if( this.skip )
      return;

    queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), addProductsHandler );

  } );

}


var deleteProductHandler = function( item ) {

  var shouldDelete = confirm( "Are you sure you want to remove all '" + item.description + "' records from the database?" );

  if( !shouldDelete )
    return;

  var changes = {};

  changes[ "/markup/products/" + item.barcodeNumber ] = null;

  ref.update( changes );
  location.reload();

}


var populateProductsList = function( currentUser ) {

	var productsPath = "/markup/products";
  var productsRef = ref.child( productsPath );
	productsRef.once( "value", function( productsSnap ) {

    productsSnap.forEach( function( productSnap ) {

      var item = {
        barcodeNumber: productSnap.key,
        price: productSnap.val().price,
        description: productSnap.val().description,
        quantity: productSnap.val().quantity,
        clearID: "clear" + productSnap.key
      }

      var $productDiv = $(
        '<div class="mdl-cell mdl-cell--6-col">' +
          '<div class="cell-container direct-content-cell productCell">' +
            item.description +
            '<button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored clearButton" style="float: right;" id="' + item.clearID + '"><i class="material-icons">clear</i></button>' +
          '</div>' +
        '</div>'
      );

      $productDiv.click( function() {

        alert( "Description: " + item.description + "\n" +
               "Price: " + item.price + "\n" +
               "Quantity: " + item.quantity + "\n" +
               "Barcode Number: " + item.barcodeNumber );

      } );

      $productDiv.insertBefore( $( "#productsPlaceholder" ) );
      if( currentUser.adminStatus !== userAdminStates.ADMIN ) {
        $( "#" + item.clearID ).hide();
        $( "#add-products-button" ).hide();
      } else {
        $( "#" + item.clearID ).click(  function() { deleteProductHandler( item ) } );
      }

    } );		

	} );

  $( "#add-products-button" ).click( function() {
    queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), addProductsHandler ); 
  } );

}
queueAdminStatusDependentFunction( ( ( 1 << userAdminStates.ADMIN ) | ( 1 << userAdminStates.MEMBER ) ), populateProductsList );


var bootNonMembers = function( currentUser ) {

  alert( "You must be a member of Beta Sigma Psi to acess this page." );
  location.replace( "/" );

}
queueAdminStatusDependentFunction( ( ( 1 << userAdminStates.NONMEMBER ) | ( 1 << userAdminStates.NONAUTH ) ), bootNonMembers );