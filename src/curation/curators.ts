import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { registerJoystreamTypes } from '@joystream/types';
import { ContentId } from '@joystream/types/lib/media';
//import { Channel } from '@joystream/types/lib/content-working-group';
import { EntityId, Entity, ClassId } from '@joystream/types/lib/versioned-store';
import { Vec } from '@polkadot/types/codec';
import { heliosContent } from './heliosContent';

const contentEntity = new ClassId(1)
const videoEntity = new ClassId(7)

async function main () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944');

  // register types before creating the api
  registerJoystreamTypes();

  // Create the API and wait until ready
  const api = await ApiPromise.create({provider});
  const keyring = new Keyring()

  const contentInDataDir = await api.query.dataDirectory.knownContentIds() as Vec<ContentId>
  const dataDirContentValues:string[] = []
  const dataDirContentIds:string[] = []
  for (let i=0; i<contentInDataDir.length; i++) {
    dataDirContentIds.push(contentInDataDir[i].toString())
    dataDirContentValues.push(keyring.encodeAddress(contentInDataDir[i]))
  }


  const entities = await api.query.versionedStore.nextEntityId() as EntityId;
  const videoEntities = []
  const videoEntityIds = []
  const contentEntityIds = []
  const contDirContentValues = []
  const contDirContentIds = []

  for (let i = 0; i<entities.toNumber(); i++) {
    const entity = await api.query.versionedStore.entityById(i) as Entity;
    if (entity.class_id.toNumber() === videoEntity.toNumber()) {
      const entityValue = entity.entity_values[7].value.value.toJSON() as number
      const entityChannelOwner = entity.entity_values[13].value.value.toJSON()
      const entityPublicationStatus = entity.entity_values[8].value.value.toJSON()
      const entityCurationStatus = entity.entity_values[9].value.value.toJSON()
      const contentEntity = await api.query.versionedStore.entityById(entityValue) as Entity;
      const contDirContentValue = contentEntity.entity_values[0].value.value.toString()
      const contDirContentId = new ContentId(keyring.decodeAddress(contDirContentValue))
      const channelVerificationStatus = await api.query.contentWorkingGroup.channelById(entityChannelOwner as number) as any;

      const videoEntity = {
        entityId: i,
        entityChannelOwner: entityChannelOwner,
        channelVerificationStatus: channelVerificationStatus[0].get("verified").toString(),
        entityPublicationStatus: entityPublicationStatus,
        entityCurationStatus: entityCurationStatus,
        contentEntityId: entityValue,
        contDirContentValue: contDirContentValue,
        contDirContentId: contDirContentId.toString()
      }
      videoEntities.push(videoEntity)
      videoEntityIds.push(i)
    } else if (entity.class_id.toNumber() === contentEntity.toNumber()) {
      const contentEntity = await api.query.versionedStore.entityById(i) as Entity;
      const contDirContentValue = contentEntity.entity_values[0].value.value.toString()
      const contDirContentId = new ContentId(keyring.decodeAddress(contDirContentValue))
      contentEntityIds.push(i)
      contDirContentValues.push(contDirContentValue)
      contDirContentIds.push(contDirContentId.toString())
    }
  }
  

  const heliosContentValues = heliosContent
  const heliosContentIds = []

  for (let i = 0; i<heliosContentValues.length; i++) {
    const heliosContentId = new ContentId(keyring.decodeAddress(heliosContentValues[i]))
    heliosContentIds.push(heliosContentId.toString())
  }


  console.log("videoEntities",videoEntities)

  /*

  console.log("dataDirContentValues",dataDirContentValues)
  console.log("dataDirContentIds",dataDirContentIds)

  console.log("contDirContentValues",contDirContentValues)
  console.log("contDirContentIds",contDirContentIds)

  console.log("heliosContentValues",heliosContentValues)
  console.log("heliosContentId",heliosContentIds)

  console.log("videoEntityIds",videoEntityIds)
  console.log("contentEntityIds",contentEntityIds)

  console.log("videoEntities",videoEntities.length)

  console.log("dataDirContentValues",dataDirContentValues.length)
  console.log("dataDirContentIds",dataDirContentIds.length)

  console.log("contDirContentValues",contDirContentValues.length)
  console.log("contDirContentIds",contDirContentIds.length)

  console.log("heliosContentValues",heliosContentValues.length)
  console.log("heliosContentIds",heliosContentIds.length)

  console.log("videoEntityIds",videoEntityIds.length)
  console.log("contentEntityIds",contentEntityIds.length)
  */

  let fail = []
  for (let i=0; i<heliosContentValues.length; i++) {
    if (!dataDirContentValues.includes(heliosContentValues[i])) {
      console.log("Content exists in helios, not in datadir",
      heliosContentValues[i],
      heliosContentIds[i]
      )
      fail.push(i)
    }
  }
  if (fail.length == 0) {
    console.log("All content existing in helios exists in datadir",)
  }
  fail = []

  for (let i=0; i<dataDirContentValues.length; i++) {
    if (!heliosContentValues.includes(dataDirContentValues[i])) {
      console.log("Content exists in datadir, not in helios",
      dataDirContentValues[i],
      dataDirContentIds[i]
      )
      fail.push(i)
    }
  }

  if (fail.length == 0) {
    console.log("All content existing in datadir exists in helios",)
  }
  fail = []

  for (let i=0; i<heliosContentValues.length; i++) {
    if (!contDirContentValues.includes(heliosContentValues[i])) {
      console.log("Content exists in helios, not in contentdir",
      heliosContentValues[i],
      heliosContentIds[i]
      )
      fail.push(i)
    }
  }

  if (fail.length == 0) {
    console.log("All content existing in helios exists in contentdir",)
  }
  fail = []

  for (let i=0; i<dataDirContentValues.length; i++) {
    if (!contDirContentValues.includes(dataDirContentValues[i])) {
      console.log("Content exists in datadir, not in contentdir",
      dataDirContentValues[i],
      dataDirContentIds[i]
      )
      fail.push(i)
    }
  }

  if (fail.length == 0) {
    console.log("All content existing in datadir exists in contentdir",)
  }


  api.disconnect();
}
main()