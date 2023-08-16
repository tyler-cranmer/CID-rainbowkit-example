import {
  addressRegistryAbi,
  namespaceAbi,
  cidNftAbi,
  pfpWrapperAbi,
} from '../abis';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { fontTransformer } from '../helpers';
import {
  CID_NFT_CONTRACT,
  NAMESPACE_CONTRACT,
  ADDRESS_REGISTRY_CONTRACT,
  SUB_PFP,
  PFP_WRAPPER_CONTRACT,
} from '../constants';
import { erc721ABI } from 'wagmi';
import { CIDType } from '../types';

export const getCID = async (address: string) => {
  let CID: CIDType = {
    walletAddress: address,
    displayName: null,
    baseName: null,
    profPic: null,
  };

  const userCIDId = (await readContract({
    address: ADDRESS_REGISTRY_CONTRACT,
    abi: addressRegistryAbi,
    functionName: 'getCID',
    args: [address],
  })) as BigInt;
  if (!userCIDId) {
    return CID;
  }

  let displayName: string | null;
  let baseName: string | null;

  const cidsNamespace = (await readContract({
    address: CID_NFT_CONTRACT,
    abi: cidNftAbi,
    functionName: 'getPrimaryData',
    args: [userCIDId, 'namespace'],
  })) as BigInt;
  //   console.log('CID NAME', cidsNamespace);
  if (!cidsNamespace) {
    displayName = null;
    baseName = null;
  } else {
    const namespace = (await readContract({
      address: NAMESPACE_CONTRACT,
      abi: namespaceAbi,
      functionName: 'getNamespaceCharacters',
      args: [cidsNamespace],
    })) as string[];
    // console.log('characters:', namespace);
    if (namespace.length) {
      displayName = namespace.join('');
      baseName =
        namespace.map((ch: string) => fontTransformer(ch)).join('') + '.canto';
    } else {
      displayName = null;
      baseName = null;
    }
  }
  CID.displayName = displayName;
  CID.baseName = baseName;
//   console.log('baseName', baseName);
//   console.log('displayName', displayName);

  const cidsPfp = (await readContract({
    address: CID_NFT_CONTRACT,
    abi: cidNftAbi,
    functionName: 'getPrimaryData',
    args: [userCIDId, SUB_PFP],
  })) as BigInt;

  let pfpUri: any;

  if (!cidsPfp) {
    pfpUri = null;
    // console.log('pfp null');
  } else {
    const pfpInfo = (await readContract({
      address: PFP_WRAPPER_CONTRACT,
      abi: pfpWrapperAbi,
      functionName: 'pfp',
      args: [cidsPfp],
    })) as any;
    // console.log('pfpInfo', pfpInfo);

    const pfpMeta = (await readContract({
      address: pfpInfo[0],
      abi: erc721ABI,
      functionName: 'tokenURI',
      args: [pfpInfo[1]],
    })) as string;
    // console.log('pfpMeta', pfpMeta);
    pfpUri = pfpMeta;
    if (pfpMeta) {
      if (pfpMeta.includes('ipfs://')) {
        pfpUri = pfpMeta.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      if (pfpMeta.includes('ar://')) {
        pfpUri = pfpMeta.replace('ar://', 'https://arweave.net/');
      }
      const image = await fetch(pfpUri, {})
        .then((res) => res.json())
        .catch((e) => {
          console.error('e', e);
        });
    //   console.log('image', image);
      CID.profPic = {
        src: image.image,
        alt: image.name,
        id: image.id,
      };
    } else {
      CID.profPic = null;
    }
  }
//   console.log("CID", CID)
  return CID
};
