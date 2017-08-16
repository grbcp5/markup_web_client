function Cart() {
  var itemsInCart = [];
  var purchasingUser = null;

  this.addItemToCart = function( item ) {

    itemsInCart.push( item );

  }

  this.setPurchasingUser = function( user ) {
    purchasingUser = user;
  }

  this.completeTransaction = function() {
    
    if( purchasingUser == null || itemsInCart.length === 0 ) {
      alert( "Cannot complete transaction" );
      return;
    }

    var changes = {};

    var transactionsPath = "/markup/transactions";
    var transactionsRef = ref.child( transactionsPath );

    var userTransactionsPath = "/members/" + purchasingUser.school.username + "/markup/transactions";

    var descriptionString = "Member:\n   " + purchasingUser.name.first + " " + purchasingUser.name.last + "\nCart:";
    for( var i = 0; i < itemsInCart.length; i++ ) {
      descriptionString += "\n   " + itemsInCart[ i ].description;

      var transactionRecord = {
        "member": purchasingUser.school.username,
        "product": itemsInCart[ i ].barcodeNumber
      }

      var newTransactionKey = transactionsRef.push().key;
      changes[ transactionsPath + "/" + newTransactionKey ] = transactionRecord;
      changes[ userTransactionsPath + "/" + newTransactionKey ] = true;

    }

    var shouldComplete = confirm( 
      descriptionString + 
      "\n\nAre you sure you want to complete this transaction?" );

    if( !shouldComplete )
      return;

    ref.update( changes )
    location.reload();

  }

  this.clearTransaction = function() {

    var shouldClear = confirm( "Are you sure you want to clear the current transaction?" );

    if( !shouldClear )
      return;

    itemsInCart = [];
    purchasingUser = null;

    location.reload();
  }

}
var cart = new Cart();

function InputHandler() {

  var currentInput = "";
  var recievedStudentID = false;

  var addItem = function( input ) {

    getItemForBarcode( input, function( item ) {

      cart.addItemToCart( item );
      addItemToList( item );

    } );

  }

  var setUser = function( input ) {
    
    getUserRefForID( input, function( userSnap ) {

      var user = {
        "name": userSnap.val().name,
        "school": userSnap.val().school
      }

      $( "#studentID" ).val( user.name.first + " " + user.name.last );
      $( "#studentIDTextField" ).addClass( "is-focus" );
      $( "#studentIDTextField" ).addClass( "is-dirty" );

      cart.setPurchasingUser( user );

    }, function() {

      alert( "That Student ID does not match any member." );
      recievedStudentID = false;

    } );

  }

  this.handleInput = function( input ) {

    if( !recievedStudentID ) {

      if( input == "" )
        return;

      setUser( input );
      recievedStudentID = true;

    } else if( input == "" ) {
      cart.completeTransaction();
    } else {
      addItem( input );
    }

  }

}
var inputHandler = new InputHandler();

function KeypressHandler( defaultInputHandler ) {

  var currentInput = "";
  var inputInProgress = false;
  var inputHandler = defaultInputHandler;

  var alertInputHandler = function() {

    if( inputHandler == null ) {
      return false;
    }

    return inputHandler( currentInput );
  }

  this.handleKeypress = function( e ) {
    e = e || window.event;

    if( !inputInProgress ) {
      inputInProgress = true;
    }

    if( e.keyCode == 13 ) {

      alertInputHandler();

      currentInput = "";
      inputInProgress = false;
    } else {
      var chr = String.fromCharCode( e.keyCode );
      currentInput += chr;
    }
    
  }

  this.setInputHandler = function( callback ) {
    inputHandler = callback;
  }

}
var keypressHandler = new KeypressHandler( inputHandler.handleInput );
document.onkeypress = keypressHandler.handleKeypress;


var getItemForBarcode = function( input, callback ) {

  var itemPath = "/markup/products/" + input;
  var itemRef = ref.child( itemPath );
  itemRef.once( "value", function( itemSnap ) {

    if( itemSnap.exists() ) {

      var item = {
        "barcodeNumber": itemSnap.key,
        "description": itemSnap.val().description,
        "price": itemSnap.val().price
      }
      callback( item );

    } else {

      alert( "That item does not match any item in the database." );
      return;

    }

  } );

}

var addItemToList = function( item ) {

  var $newItem = $( 
    '<div class="mdl-cell mdl-cell--6-col">' +
      '<div class="cell-container direct-content-cell">' +
        '<div class="text-field-container">' +
          '<div class="mdl-textfield mdl-js-textfield is-dirty is-focus" id="' + item.barcodeNumber + 'TextField">' +
            '<input class="mdl-textfield__input" type="text" pattern="-?[0-9]*(\.[0-9]+)?" id="' + item.barcodeNumber + '" value="' + item.description + '">' +
            '<label class="mdl-textfield__label" for="' + item.barcodeNumber + '">Add Item...</label>' +
            '<span class="mdl-textfield__error">Input is not a number!</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' );

  $newItem.insertBefore( $( "#itemPlaceholder" ) );

}

$( "#complete-transaction-button" ).click( function() {
  cart.completeTransaction() 
} );
$( "#clear-transaction-button" ).click( function() {
  cart.clearTransaction() 
} );