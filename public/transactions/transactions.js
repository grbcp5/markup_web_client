


$( "#clear-transactions-button" ).hide();

function TransactionManager() {

  var membersWithTransactions = [];

  var addMemberToList = function( mem ) {

    console.log( mem.name.first + " " + mem.name.last + ": " + mem.total );

    var $memberTotalDiv = 
      $(
        '<div class="mdl-cell mdl-cell--6-col">' +
          '<div class="cell-container direct-content-cell">' +
            mem.name.first + " " + mem.name.last + ": " + mem.total +
          '</div>' +
        '</div>'
      );

    $memberTotalDiv.insertBefore( $( "#memberTotalPlaceholder" ) );

  }


  var getMemberTotals = function( members, transactions, products ) {

    var memberTotals = {};

    var memberIDs = Object.keys( members );

    for( var m = 0; m < memberIDs.length; m++ ) {
      var memberTotal = 0.0;
      var member = members[ memberIDs[ m ] ];

      if( member.markup == null || member.markup.transactions == null )
        continue;

      var memberTransactions = member.markup.transactions;
      var memberTransactionKeys = Object.keys( memberTransactions );

      for( var t = 0; t < memberTransactionKeys.length; t++ ) {

        var transaction = transactions[ memberTransactionKeys[ t ] ];
        memberTotal += products[ transaction.product ].price;

      }

      memberTotalObj = {
        "memberID": memberIDs[ m ],
        "total": memberTotal,
        "name": members[ memberIDs[ m ] ].name
      };

      membersWithTransactions.push( memberIDs[ m ] );
      setTimeout( addMemberToList, 0, memberTotalObj );

    }

  }

  clearTransactionHandler = function() {

    var shouldClear = confirm( "WARNING!\nThis action removes all transactions from the database and cannot be undone.\nWould you like to delete all transactions?" );

    if( !shouldClear ) {
      return;
    }

    var changes = {};

    changes[ "/markup/transactions/" ] = null;

    for( var i = 0; i < membersWithTransactions.length; i++ ) {
      changes[ "members/" + membersWithTransactions[ i ] + "/markup/transactions" ] = null;
    }

    ref.update( changes );
    location.reload();

  }

  this.loadAllTransactions = function( currentUser ) {

    $( "#clear-transactions-button" ).show();
    $( "#clear-transactions-button" ).click( clearTransactionHandler );

    var membersPath = "/members";
    var membersRef = ref.child( membersPath );
    membersRef.once( "value", function( membersSnap ) {

      var members = membersSnap.val();

      var transactionsPath = "/markup/transactions";
      var transactionsRef = ref.child( transactionsPath );
      transactionsRef.once( "value", function( transactionsSnap ) {

        var transactions = transactionsSnap.val();

        var productsPath = "/markup/products";
        var productsRef = ref.child( productsPath );
        productsRef.once( "value", function( productsSnap ) {

          var products = productsSnap.val();

          getMemberTotals( members, transactions, products );

        } ); 

      } );

    } );

  }

}
var transactionManager = new TransactionManager();
queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), transactionManager.loadAllTransactions );