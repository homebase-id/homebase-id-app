import { MessageContainerProps, DaysPositions } from '../../../MessageContainer/types'
import { IMessage } from '../../Models'

export interface ItemProps<TMessage extends IMessage> extends MessageContainerProps<TMessage> {
    currentMessage: TMessage
    previousMessage?: TMessage
    nextMessage?: TMessage
    position: 'left' | 'right'
    scrolledY: { value: number }
    daysPositions: { value: DaysPositions }
    listHeight: { value: number }
}
