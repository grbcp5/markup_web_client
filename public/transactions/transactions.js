


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

  clearTransactionHandler = function( currentUser ) {

    var shouldClear = confirm( "WARNING!\n\nThis action removes all transactions from the database and cannot be undone.\n\nWould you like to delete all transactions?" );

    if( !shouldClear ) {
      return;
    }

    var changes = {};

    changes[ "/markup/transactions/" ] = null;

    for( var i = 0; i < membersWithTransactions.length; i++ ) {
      changes[ "members/" + membersWithTransactions[ i ] + "/markup/transactions" ] = null;
    }

    ref.update( changes );

    changes = {};
    changes[ "/markup/transactions/lastClear" ] = {
      "admin": currentUser.username,
      "timestamp": firebase.database.ServerValue.TIMESTAMP
    }
    ref.update( changes );

    location.reload();

  }

  this.loadAllTransactions = function( currentUser ) {

    $( "#clear-transactions-button" ).show();
    $( "#clear-transactions-button" ).click( function() {
      queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), clearTransactionHandler );
    } );

    var lastClearPath = "/markup/transactions/lastClear";
    var lastClearRef = ref.child( lastClearPath );
    lastClearRef.once( "value", function( lastClearSnap ) {

      if( !lastClearSnap.exists() ) {
        return;
      }

      $( "#lastClearUsername" ).text( lastClearSnap.val().admin );

      var timestamp = new Date( lastClearSnap.val().timestamp );
      $( "#lastClearTime" ).text( timestamp.customFormat( "#DD#/#MM#/#YYYY# #hh#:#mm#:#ss#" ) );


    } );

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

//*** This code is copyright 2002-2016 by Gavin Kistner, !@phrogz.net
//*** It is covered under the license viewable at http://phrogz.net/JS/_ReuseLicense.txt
Date.prototype.customFormat = function(formatString){
  var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhhh,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
  var dateObject = this;
  YY = ((YYYY=dateObject.getFullYear())+"").slice(-2);
  MM = (M=dateObject.getMonth()+1)<10?('0'+M):M;
  MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
  DD = (D=dateObject.getDate())<10?('0'+D):D;
  DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObject.getDay()]).substring(0,3);
  th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
  formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);

  h=(hhh=dateObject.getHours());
  if (h==0) h=24;
  if (h>12) h-=12;
  hh = h<10?('0'+h):h;
  hhhh = hhh<10?('0'+hhh):hhh;
  AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
  mm=(m=dateObject.getMinutes())<10?('0'+m):m;
  ss=(s=dateObject.getSeconds())<10?('0'+s):s;
  return formatString.replace("#hhhh#",hhhh).replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
}