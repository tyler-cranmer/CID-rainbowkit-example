import {
  addressRegistryAbi,
  namespaceAbi,
  cidNftAbi,
  pfpWrapperAbi,
} from '../abis';
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
import { useEffect, useState } from 'react';

export const useCID = (address: `0x${string}`) => {
  const [CID, setCID] = useState<CIDType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    /**
     * Helper Function to grab Image data from Profile Pic NFT
     * @param uri 
     * @returns 
     */
    const fetchImage = async (uri: string) => {
      try {
        const res = await fetch(uri);
        return await res.json();
      } catch (e) {
        console.log('Failed to fetch image:', e);
        return null;
      }
    };

    /**
     * Helper function that transforms URI to invlude correct url format.
     * @param uri 
     * @returns uri
     */
    const transformURI = (uri: string) => {
      if (uri.includes('ipfs://')) {
        return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      if (uri.includes('ar://')) {
        return uri.replace('ar://', 'https://arweave.net/');
      }
      return uri;
    };

    /**
     * Gets the CID information.
     * 
     * Steps
     * 1. get userCIDId from Address registry contract
     * 2. get cidsNamespace from CID NFT contract
     * 3. get namespace from Namespace Contract
     *    3.a generate the displayName
     *    3.b map over namespace to create baseName -> name.canto
     *        (The transform function removes emojis and fonts)
     * 4. get pfpCID from CID NFT contract
     * 5. get pfpInfo from PFP Wrapper Contract returns [contract address, NFTID]
     * 6. get pfpTokenURI 
     * 7. return CID object
     * @param address 
     * @returns CID object.
     * 
     * CID object: 
     *      - walletAddress
     *     - Namespace displayName (has emojis)
     *     - Namespace  baseName (no emojis + .canto)
     *     - Prof Pic 
     *          - src
     *          - alt
     *          - id
     */

    const getCID = async (address: `0x${string}`) => {
      let CID: CIDType = {
        walletAddress: address,
        displayName: null,
        baseName: null,
        profPic: null,
      };

      const userCIDId: BigInt = (await readContract({
        address: ADDRESS_REGISTRY_CONTRACT,
        abi: addressRegistryAbi,
        functionName: 'getCID',
        args: [address],
      })) as BigInt;

      if (!userCIDId) return CID;

      const cidsNamespace = (await readContract({
        address: CID_NFT_CONTRACT,
        abi: cidNftAbi,
        functionName: 'getPrimaryData',
        args: [userCIDId, 'namespace'],
      })) as BigInt;

      if (cidsNamespace) {
        const namespace = (await readContract({
          address: NAMESPACE_CONTRACT,
          abi: namespaceAbi,
          functionName: 'getNamespaceCharacters',
          args: [cidsNamespace],
        })) as string[];

        if (namespace.length) {
          CID.displayName = namespace.join('');
          CID.baseName = `${namespace.map(fontTransformer).join('')}.canto`;
        }
      }

      const cidsPfp = (await readContract({
        address: CID_NFT_CONTRACT,
        abi: cidNftAbi,
        functionName: 'getPrimaryData',
        args: [userCIDId, SUB_PFP],
      })) as BigInt;

      if (cidsPfp) {
        const pfpInfo = (await readContract({
          address: PFP_WRAPPER_CONTRACT,
          abi: pfpWrapperAbi,
          functionName: 'pfp',
          args: [cidsPfp],
        })) as any;

        console.log("pfp", pfpInfo)
        const pfpTokenUri = (await readContract({
          address: pfpInfo[0],
          abi: erc721ABI,
          functionName: 'tokenURI',
          args: [pfpInfo[1]],
        })) as string;

        if (pfpTokenUri) {
          const transformedUri = transformURI(pfpTokenUri);
          const image = await fetchImage(transformedUri);
          if (image) {
            CID.profPic = {
              src: image.image,
              alt: image.name,
              id: image.id,
            };
          }
        }
      }
      return CID;
    };

    const fetchData = async () => {
      try {
        const cidData = await getCID(address);
        setCID(cidData);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  return { CID, loading, error };
};
