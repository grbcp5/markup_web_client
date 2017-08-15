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
      if( currentUser.adminStatus !== userAdminStates.ADMIN )
        $( "#" + item.clearID ).hide();

    } );		

	} );

}
queueAdminStatusDependentFunction( ( ( 1 << userAdminStates.ADMIN ) | ( 1 << userAdminStates.MEMBER ) ), populateProductsList );


var bootNonMembers = function( currentUser ) {

  alert( "You must be a member of Beta Sigma Psi to acess this page." );
  location.replace( "/" );

}
queueAdminStatusDependentFunction( ( ( 1 << userAdminStates.NONMEMBER ) | ( 1 << userAdminStates.NONAUTH ) ), bootNonMembers );