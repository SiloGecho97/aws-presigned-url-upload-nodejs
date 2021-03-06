const aws = require("aws-sdk");
const fs = require("fs");
const request = require("request");
const axios = require("axios");

var AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "<Your-Profile>" });
AWS.config.credentials = credentials;

AWS.config.update({ region: "<region>" });

// Create S3 service object
let s3 = new AWS.S3({ apiVersion: "2006-03-01" });

//let sing file with aws authentication
const signFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: "your_packet",
            Fields: {
                key: filePath.split(".")[0],
            },
            //Expires: config.aws.expire,
            Conditions: [
                ["content-length-range", 0, 10000000], // 10 Mb
                { acl: "public-read" },
            ],
        };
        //create presigned post URL
        s3.createPresignedPost(params, (err, data) => {
            resolve(data);
        });
    });
};
/**
 * Send File to
 * @param {*} filePath 
 * @param {*} payload 
 */
const sendFile = (filePath, payload) => {
    const FormData = require("form-data");

    const form = new FormData();
    form.append("acl", "public-read");
    //append the fields to formData
    for (const field in payload.fields) {
        form.append(field, payload.fields[field]);
    }
    //read the file and append to formData
    form.append("file", fs.createReadStream(__dirname + `/${filePath}`));

    //get Legth of formData
    form.getLength((err, length) => {

        if (err) console.log(err);

        //send to presigned URL.
        axios({
            method: "POST",
            url: payload.url,
            data: form,
            headers: { ...form.getHeaders(), "Content-Length": length, },
        })
            .then((response) => {
                console.log(response.ok);
                console.log(response.status);
                console.log(response.statusText);
                console.log(response);
                return response.text();
            })
            .then((payload) => {
                console.log(payload);
                console.log(form.getHeaders());
            })
            .catch((err) => console.log(`${err}`));
    });
};

//make sure file located in this directory
const file = "vout-axios.txt";
const filePath = `${file}`;
signFile(filePath).then((payload) => {
    sendFile(file, payload);
});