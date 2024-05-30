const MODULE_ID = "parallax-tiles";

Hooks.once("init", async function() {
	console.log("parallax Module Test")
	game.parallaxTiles = {
		// getParallaxTiles,
		testParallaxTiles
	}

});


Hooks.on("renderTileConfig", (app, html, data) => {
	html = html[0] ?? html;
	console.log(html)

	//create new tab
	html.querySelector(`.sheet-tabs`).insertAdjacentHTML("beforeend", `
	<a class="item" data-tab="parallax">
	<i class="fas fa-stars">
	</i> Parallax</a>
	`);

	const enableCheckbox = app.document.getFlag(MODULE_ID, "enable") ? "checked" : "";
	//create tab content
	html.querySelector(`.sheet-footer`).insertAdjacentHTML("beforebegin", `
	<div class="tab" data-tab="parallax">
		<p class="notes">Parallax-Tile Options Here.</p>

		<div class="form-group">
			<label>Enable Parallax Tiles</label>
			<div class="form-fields">
				<input type="checkbox" name="flags.${MODULE_ID}.enable" ${enableCheckbox}>
			</div>
		</div>

	</div>    
	`);

});

Hooks.on("canvasPan", (scene, screenPosistion) => {
	testParallaxTiles();
	// console.log("ENTER")
	// console.log(canvas.scene.tiles.size)
	// getParallaxTiles();
	//on pan, cycle through all the tiles for tiles with (flags.${MODULE_ID}.enable == true), and render with offset stuff... IDK how to do that yet
});

function testParallaxTiles(){
	// console.log(canvas.scene.tiles.size)

	const parallaxTiles = [];
	for(const t of canvas.scene.tiles){
		if(t.getFlag(MODULE_ID, "enable")){
			// parallaxTiles.push(t.object);

			// t.object.mesh.x = t.object.x + t.object.width/2
			// t.object.mesh.y = t.object.y + t.object.length/2


			const parallaxFactor = 0.1;
			const maxOffset = 75;

			// // Calculate the center of the object's mesh
			// let objectMeshCenterX = t.object.x + t.object.mesh.width / 2;
			// let objectMeshCenterY = t.object.y + t.object.mesh.height / 2;

			// // Calculate the distance between the camera center and the object's mesh center
			// let deltaX = canvas.stage.pivot.x - objectMeshCenterX;
			// let deltaY = canvas.stage.pivot.y - objectMeshCenterY;

		    // // Apply the parallax effect
			// let parallaxOffsetX = deltaX * parallaxFactor;
			// let parallaxOffsetY = deltaY * parallaxFactor;

			// // Constrain the parallax offset to the maximum offset
			// if (Math.abs(parallaxOffsetX) > maxOffset) {
			// 	parallaxOffsetX = Math.sign(parallaxOffsetX) * maxOffset;
			// }
			// if (Math.abs(parallaxOffsetY) > maxOffset) {
			// 	parallaxOffsetY = Math.sign(parallaxOffsetY) * maxOffset;
			// }

			// // Calculate the new position of the object's mesh
			// t.object.mesh.x = objectMeshCenterX - parallaxOffsetX;
			// t.object.mesh.y = objectMeshCenterY - parallaxOffsetY;


			let objectMeshCenterX = t.object.x + t.object.mesh.width / 2;
			let objectMeshCenterY = t.object.y + t.object.mesh.height / 2;
		
			// Calculate the distance between the camera center and the object's mesh center
			let deltaX = canvas.stage.pivot.x - objectMeshCenterX;
			let deltaY = canvas.stage.pivot.y - objectMeshCenterY;
		
			// Apply the parallax effect
			let rawParallaxOffsetX = deltaX * parallaxFactor;
			let rawParallaxOffsetY = deltaY * parallaxFactor;
		
			// Constrain the parallax offset using a smooth approach with tanh
			let parallaxOffsetX = maxOffset * Math.tanh(rawParallaxOffsetX / maxOffset);
			let parallaxOffsetY = maxOffset * Math.tanh(rawParallaxOffsetY / maxOffset);
		
			// Calculate the new position of the object's mesh
			t.object.mesh.x = objectMeshCenterX - parallaxOffsetX;
			t.object.mesh.y = objectMeshCenterY - parallaxOffsetY;

		}
	}
	return parallaxTiles;
}

// function getParallaxTiles(){
// 	const parallaxTiles = [];
// 	for(const t of canvas.scene.tiles){
// 		if(t.getFlag(MODULE_ID, "enable")){
// 			parallaxTiles.push(t.object);
// 		}
// 	}
// 	return parallaxTiles;
// }
