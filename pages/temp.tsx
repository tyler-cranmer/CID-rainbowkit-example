import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CIP } from 'cip-sdk';
import { chains } from './_app';

// Retrieve user data using CIP
type ProfilePictureInfo = {
  src: string;
  alt: string;
};

type NameSpace = {
  displayName: string;
  baseName: string;
};

// select the right chain from wagmi
const cantoChain = chains[0];
const rpcUrl = cantoChain.rpcUrls.default.http[0];

// Initialize provider and CIP instance
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const cipInstance = new CIP(provider);

//helper function to handle nft picture data. 
const transformUri = (uri: string) => {
  if (!uri) return '';
  else if (uri.includes('ipfs://')) {
    return uri.replace('ipfs://', 'https://dweb.link/ipfs/');
  } else if (uri.includes('arweave://')) {
    return uri.replace('arweave://', 'https://arweave.net/');
  }
  return uri;
};

function Temp() {
  const [isLoading, setIsLoading] = useState(false);
  const [namespace, setNamespace] = useState<NameSpace>({
    displayName: '',
    baseName: '',
  });
  const [bio, setBio] = useState('');
  const [pfp, setPfp] = useState<ProfilePictureInfo>({
    src: '',
    alt: '',
  });

  const handleCall = async () => {
    try {
      setIsLoading(true);
      const addr = 'user address';
      
      const namespace = await cipInstance.getNamespaceByAddress(addr);
      const bio = await cipInstance.getBioByAddress(addr);
      const pfp = await cipInstance.getPfpByAddress(addr);
  
      setNamespace({
        displayName: namespace.displayName,
        baseName: namespace.baseName,
      });
  
      setBio(bio);
  
      setPfp({
        src: transformUri(pfp.src),
        alt: pfp.alt,
      });
  
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className='mt-20 flex justify-center align-middle'>
      <div className=''>
        {/* ID CARD */}
        <div
          id='shared-id'
          className='m-auto flex max-w-xl flex-col bg-idCard py-3 px-3'
        >
          <div className='mr-4 flex-shrink-0'></div>
          <div className='flex h-[345px] w-[345px] flex-col items-center justify-between bg-white p-3'>
            <img
              src={pfp.src}
              height={90}
              width={135}
              alt={pfp.alt}
              className='rounded-full'
            />
            <h1 className='mb-1 mt-4 break-words text-2xl'>{namespace.displayName}</h1>
            <h2 className='text-md mb-2 text-gray-400'>{namespace.baseName}</h2>
            <p className='flex-grow text-sm'>{bio}</p>
          </div>
          <div className='mt-1.5 flex justify-between'>
            <div className='mt-1 text-xl font-light text-white'>#14</div>
            <div className='text-md font-light text-white'>
            </div>
            <div
              onClick={handleCall}
              className='items-center bg-slate-600 text-white'
            >
              <button className='rounded bg-slate-500 py-2 px-4 font-bold text-white hover:bg-slate-700'>
                {isLoading ? 'loading' : 'fetch data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Temp;


