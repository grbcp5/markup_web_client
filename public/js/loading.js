/*****************************************************************************
 * 
 * File: 
 *   /js/loading.js
 *
 * Original Author:
 *   Grant Broadwater
 *
 * Description:
 *   Provides loading screen functionality.
 *
 *****************************************************************************/

$( "#loading-screen" ).hide();
var loadingEngaged = false;
var loadingContent = {};

var startLoadingProcess = function( processKey ) {

	if( loadingContent[ processKey] ) {
		return false;
	}

	if( !loadingEngaged ) {
		$( "#loading-screen" ).show();
		loadingEngaged = true;
	}

	loadingContent[ processKey ] = true;

	return true;
}

var terminateLoadingProcess = function( processKey ) {

	if( !loadingContent[ processKey ] ) {
		return false;
	}

	delete loadingContent[ processKey ];

	if( Object.keys( loadingContent ).length === 0 ) {
		loadingEngaged = false;
		$( "#loading-screen" ).hide();
	}

	return true;
}