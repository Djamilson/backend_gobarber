import aws from 'aws-sdk';

export default async function s3DeleteObject(bucket, file) {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });
  console.log('S3 DELETE: ', file);

  const listParams = {
    Bucket: bucket,
    Prefix: 'uploads/' + file,
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] },
  };

  listedObjects.Contents.forEach(({ Key }) => {
    console.log('Passsei aqui::', Key);
    deleteParams.Delete.Objects.push({ Key });
  });

  console.log(':::deleteParamss', deleteParams);

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) await s3DeleteObject(bucket, file);
}
