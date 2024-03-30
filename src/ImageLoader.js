let imagesList;
const textLoaded = {};
let image = new Image();

export function get(_id) {
	if (!textLoaded[_id]) {
		return null;
	}
	return textLoaded[_id];
}

export function loadBatch(list) {
	imagesList = list;
	return new Promise(resolveCallback => loadNextTexture(resolveCallback));
}
	
function loadNextTexture(resolveCallback) {
	const nextText = imagesList.shift();
    
    image.onload = () => {

        createImageBitmap(image).then(imageData => {
            textLoaded[nextText.id] = imageData;
            if (imagesList.length == 0) {
                resolveCallback();
            } else {
                loadNextTexture(resolveCallback);
            }
        });
    };

    image.src = nextText.url;

}