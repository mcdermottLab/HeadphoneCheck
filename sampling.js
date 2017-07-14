function rand_int(num) {
    // returns random integer between 0 and num, exclusive
    return Math.floor(Math.random() * num);
}

function sample_with_replacement(arr, n) {
    samples = [];
    for(var i = 0; i < n; i++) {
        ind = rand_int(arr.length);
        samples.push(arr[ind]);
    }
    return samples;
}

function sample_without_replacement(inarr, n) {
    var arr = JSON.parse(JSON.stringify(inarr));
    samples = [];
    for(var i = 0; i < n; i++) {
        ind = rand_int(arr.length);
        samples.push(arr[ind]);
        arr.splice(ind, 1);
    }

    return samples;

}

// test

var test = ["a", "b", "c"];
var verify = sample_with_replacement(test, 10000);

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


