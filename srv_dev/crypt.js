// Chaîne ucs-2 en ascii encodé en base64
function uena(chn) {
    return window.btoa(unescape(encodeURIComponent(chn)));
}
// Ascii encodé en base64 en chaîne ucs-2
function aenu(chn) {
    return decodeURIComponent(escape(window.atob(chn)));
}

function getScpecial(key) {
	let hasharr = new Hashes.SHA256().b64(key).split("").map(c=>c.charCodeAt(0));
	let num = 0;
	for (let i = 0; i < hasharr.length; i++) {
		if (hasharr[i] >= 65 && hasharr[i] <= 75)
			num++;
	}
	// console.log(`num is ${num}`)
	return (num);
}

function encode2(text, key) {
	let tarr = text.split("").map(c=>c.charCodeAt(0));
	let karr = key.split("").map(c=>c.charCodeAt(0));
	let alphar = "qazwsxedcrfvtgbyhnujmikolp".split("").map(c=>c.charCodeAt(0));
	let hash = new Hashes.SHA256().b64(key);
	let hasharr = hash.split("").map(c=>c.charCodeAt(0));

	// for (let i = 0; i < 10; i++) {
	// 	tarr[i] -= getScpecial(key);
	// }

	for (let i = 0; i < hasharr.length; i+=10) {
		tarr[i % Math.round(hasharr.length / 1.1)] ^= hasharr[i];
	}

	let arr = [];
	for (let i = 0; i < tarr.length; i++) {
		let imolen = i % karr.length;
		arr.push((tarr[i]));
		arr[i] ^= karr[imolen];
		// arr[i] -= getScpecial(key + karr[imolen] + "" + i);
		arr[i] ^= karr[karr.length - imolen];
		arr[i] ^= karr.length;
		arr[i] ^= alphar[karr.length%26];
	}
	for (let i = 1; i < arr.length; i++) {
		arr[i] ^= arr[i - 1];
	}
	let str = arr.map(n=>String.fromCharCode(n)).join("");
	str = uena(str);
	return (str);
}

function encode(text, key) {
	text = encode2(text, key);
	text = encode2(text, key);
	// text = encode2(text, key);
	return text;
}

function decode2(text, key) {
	text = aenu(text);
	let tarr = text.split("").map(c=>c.charCodeAt(0));
	let karr = key.split("").map(c=>c.charCodeAt(0));
	let alphar = "qazwsxedcrfvtgbyhnujmikolp".split("").map(c=>c.charCodeAt(0));
	let hash = new Hashes.SHA256().b64(key);
	let hasharr = hash.split("").map(c=>c.charCodeAt(0));
	
	for (let i = tarr.length - 1; i >= 1; i--) {
		tarr[i] ^= tarr[i - 1];
	}
	let arr = [];
	for (let i = 0; i < tarr.length; i++) {
		let imolen = i % karr.length;
		arr.push(tarr[i]);
		arr[i] ^= alphar[karr.length%26];
		arr[i] ^= karr.length;
		arr[i] ^= karr[karr.length - imolen];
		// arr[i] += getScpecial(key + karr[imolen] + "" + i);
		arr[i] ^= karr[imolen];
	}

	for (let i = 0; i < hasharr.length; i+=10) {
		arr[i % Math.round(hasharr.length / 1.1)] ^= hasharr[i];
	}

	// for (let i = 0; i < 10; i++) {
	// 	arr[i] += getScpecial(key);
	// }

	let str = arr.map(n=>String.fromCharCode(n)).join("");
	return str;
}

function decode(text, key) {
	text = decode2(text, key);
	text = decode2(text, key);
	// text = decode2(text, key);
	return text;
}

const key = "K4sZSN}mJlfxQ;elkjsP3b0.";
let txt = encode("Je suis Mayeul et mon nom est LE MONIES DE SAGAZAN", key);

console.log(`encoded = ${txt}`);

let res = decode(txt, key);

console.log(`decoded = ${res}`);

// for (let i = 0; i < 500; i++) {
// 	console.log(encode(i.toString(), key) + " : " + i)
// }

function getStr(n) {
	let str = "";
	for (let i = 0; i < n; i++) {
		str += "a";
	}
	return (str);
}

// for (let i = 10; i < 30; i++) {
// 	  let test = encode(getStr(i), key);
// 	  console.log(test)
// }
let timer = Date.now();
encode(getStr(10000000), key);
console.log("done in " + ((Date.now() - timer) / 1000) + " seconds")