// function rand_int(num) {
//   // returns random integer between 0 and num, exclusive
//   return Math.floor(Math.random() * num);
// }

function randomInt(a, b, n) {
  // generate n random integers between [a, b)
  // OLD: generate n random integers between [a, b]
  var randIntList = [];
  var minVal = Math.min(a, b);
  var maxVal = Math.max(a, b);
  // var rand = minVal + (maxVal - minVal) * Math.random();
  for (var i = 0; i < n; i++) {
    // randIntList.push(Math.floor(minVal + (maxVal - minVal + 1) * Math.random())); // OLD: +1 to include right endpoint
    randIntList.push(Math.floor(minVal + (maxVal - minVal) * Math.random()));
  }
  outVal = n == 1 ? randIntList[0] : randIntList;
  return outVal;
}

function sampleWithReplacement(arr, n) {
  samples = [];
  for(var i = 0; i < n; i++) {
    ind = randomInt(0, arr.length, 1);
    samples.push(arr[ind]);
  }
  return samples;
}

// function sampleWithoutReplacement(inarr, n) {
//   var arr = JSON.parse(JSON.stringify(inarr));
//   samples = [];
//   for(var i = 0; i < n; i++) {
//     ind = randomInt(arr.length);
//     samples.push(arr[ind]);
//     arr.splice(ind, 1);
//   }

//   return samples;

// }

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// test

var test = ["a", "b", "c"];
var verify = sampleWithReplacement(test, 10000);

function count(arr, el) {
  var c = 0;
  for(var i = 0; i < arr.length; ++i){
    if(arr[i] == el)
      c++;
  }
  return c;
}

console.log("here");
console.log(test);

for(var i = 0; i < test.length; i++) {
  console.log(count(verify, test[i]));
}


