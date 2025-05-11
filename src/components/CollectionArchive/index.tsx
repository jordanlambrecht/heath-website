import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  items: CardPostData[]
  relationTo: 'posts' | 'poems'
  showCategories?: boolean
}

export function CollectionArchive(props: Props) {
  const { items, relationTo, showCategories } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div className="col-span-1" key={index}>
                  <Card
                    className="h-full bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out"
                    doc={result}
                    relationTo={relationTo}
                    showCategories={relationTo === 'posts' ? showCategories : false}
                  />
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
