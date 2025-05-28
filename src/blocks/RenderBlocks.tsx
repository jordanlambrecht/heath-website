import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ContentBlock } from '@/blocks/Content/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

type BlockComponentProps = {
  disableInnerContainer?: boolean
}

const blockComponents: Record<
  string,
  React.ComponentType<Page['layout'][0] & BlockComponentProps>
> = {
  content: ContentBlock,
  mediaBlock: MediaBlock,
}

export function RenderBlocks(props: { blocks: Page['layout'][0][] }) {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
